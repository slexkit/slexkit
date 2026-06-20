import type { Editor, NodeViewRendererProps } from "@tiptap/core";
import CodeBlock from "@tiptap/extension-code-block";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { NodeView } from "@tiptap/pm/view";
import {
  createSlexKitMarkdownRuntimeHost,
  parseSlexSource,
  type SlexKitMarkdownRuntimeHost,
  type ThemeMode,
} from "slexkit";

export type SlexKitTiptapOptions = {
  artifactId?: string | ((ctx: { editor: Editor }) => string);
  runtimeHost?: SlexKitMarkdownRuntimeHost;
  theme?: ThemeMode;
  showSource?: boolean;
  sourceLabel?: string;
  previewLabel?: string;
  className?: string;
  onError?: (error: unknown, source: string) => void;
};

export type SlexKitTiptapNodeViewOptions = Required<
  Pick<SlexKitTiptapOptions, "showSource" | "sourceLabel" | "previewLabel">
> &
  Pick<SlexKitTiptapOptions, "artifactId" | "className" | "onError" | "runtimeHost" | "theme">;

const DEFAULT_OPTIONS: SlexKitTiptapNodeViewOptions = {
  showSource: true,
  sourceLabel: "Source",
  previewLabel: "",
};

type NodeViewMutationRecord = Parameters<NonNullable<NodeView["ignoreMutation"]>>[0];

const PREVIEW_INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='slider']",
  "[role='switch']",
  "[role='tab']",
  "[role='textbox']",
].join(",");

const editorArtifactIds = new WeakMap<Editor, string>();
let nextArtifactId = 0;
const sourceOpenStates = new Map<string, boolean>();
const editorArtifactRuntimes = new WeakMap<Editor, Map<string, TiptapArtifactRuntime>>();

type TiptapArtifactRuntime = {
  artifactId: string;
  runtimeHost: SlexKitMarkdownRuntimeHost;
  views: Set<SlexKitCodeBlockNodeView>;
  scheduled: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRenderableSource(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if ("layout" in value) return isRecord(value.layout) && Object.keys(value.layout).length > 0;
  if ("namespace" in value || "g" in value) return false;
  return Object.keys(value).some((key) => key.includes(":"));
}

function isStateOnlySource(value: unknown): boolean {
  return isRecord(value)
    && !isRenderableSource(value)
    && ("slex" in value || "namespace" in value || "g" in value);
}

function resolveArtifactId(editor: Editor, option: SlexKitTiptapOptions["artifactId"]): string {
  if (typeof option === "function") return option({ editor });
  if (typeof option === "string" && option.trim()) return option;

  const existing = editorArtifactIds.get(editor);
  if (existing) return existing;

  const artifactId = `tiptap-${++nextArtifactId}`;
  editorArtifactIds.set(editor, artifactId);
  return artifactId;
}

function codeBlockLanguage(node: ProseMirrorNode): string {
  return String(node.attrs.language ?? node.attrs.defaultLanguage ?? "").toLowerCase();
}

function sourceOpenStateKey(artifactId: string, node: ProseMirrorNode): string {
  return `${artifactId}::${node.textContent}`;
}

function compareNodeViewOrder(a: SlexKitCodeBlockNodeView, b: SlexKitCodeBlockNodeView): number {
  if (a.dom === b.dom) return 0;
  const position = a.dom.compareDocumentPosition(b.dom);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

function resolveArtifactRuntime(
  editor: Editor,
  artifactId: string,
  runtimeHost: SlexKitMarkdownRuntimeHost | undefined,
): TiptapArtifactRuntime {
  let runtimes = editorArtifactRuntimes.get(editor);
  if (!runtimes) {
    runtimes = new Map();
    editorArtifactRuntimes.set(editor, runtimes);
  }

  let runtime = runtimes.get(artifactId);
  if (!runtime) {
    runtime = {
      artifactId,
      runtimeHost: runtimeHost ?? createSlexKitMarkdownRuntimeHost(),
      views: new Set(),
      scheduled: false,
    };
    runtimes.set(artifactId, runtime);
  }
  return runtime;
}

function scheduleArtifactRender(runtime: TiptapArtifactRuntime): void {
  if (runtime.scheduled) return;
  runtime.scheduled = true;
  queueMicrotask(() => {
    runtime.scheduled = false;
    runtime.runtimeHost.disposeArtifact(runtime.artifactId);
    for (const view of Array.from(runtime.views).sort(compareNodeViewOrder)) {
      view.renderWithRuntime(runtime.runtimeHost);
    }
  });
}

function unregisterArtifactRuntime(editor: Editor, runtime: TiptapArtifactRuntime, view: SlexKitCodeBlockNodeView): void {
  runtime.views.delete(view);
  if (runtime.views.size > 0) {
    scheduleArtifactRender(runtime);
    return;
  }

  runtime.runtimeHost.disposeArtifact(runtime.artifactId);
  editorArtifactRuntimes.get(editor)?.delete(runtime.artifactId);
}

function createElement(doc: Document, tag: string, className?: string): HTMLElement {
  const element = doc.createElement(tag);
  if (className) element.className = className;
  return element;
}

function stopPropagation(event: Event): void {
  event.stopPropagation();
}

function stopProseMirrorEvents(element: HTMLElement, events: string[]): void {
  for (const eventName of events) element.addEventListener(eventName, stopPropagation);
}

function focusPreviewInteractiveTarget(event: Event): void {
  const target = event.target;
  const targetElement = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  const interactive = targetElement?.closest(PREVIEW_INTERACTIVE_SELECTOR);
  if (interactive instanceof HTMLElement) interactive.focus({ preventScroll: true });
}

function markPreviewInteractive(preview: HTMLElement, force = false): void {
  if (preview.getAttribute("contenteditable") !== "false") {
    preview.setAttribute("contenteditable", "false");
  }

  preview.querySelectorAll(PREVIEW_INTERACTIVE_SELECTOR).forEach((element) => {
    if (element instanceof HTMLElement && (force || element.getAttribute("contenteditable") !== "true")) {
      if (force) element.removeAttribute("contenteditable");
      element.setAttribute("contenteditable", "true");
    }
  });
}

function schedulePreviewInteractiveMark(preview: HTMLElement): void {
  markPreviewInteractive(preview);
  queueMicrotask(() => markPreviewInteractive(preview, true));

  const win = preview.ownerDocument.defaultView;
  win?.setTimeout(() => markPreviewInteractive(preview, true), 0);
  win?.requestAnimationFrame(() => markPreviewInteractive(preview, true));
}

function renderError(error: unknown, source: string, container: HTMLElement): void {
  const doc = container.ownerDocument || document;
  const alert = createElement(doc, "div", "slex-tiptap-error");
  alert.setAttribute("role", "alert");
  const title = createElement(doc, "div", "slex-tiptap-error-title");
  title.textContent = "Failed to render SlexKit";
  const message = createElement(doc, "div", "slex-tiptap-error-message");
  message.textContent = error instanceof Error ? error.message : String(error);
  alert.append(title, message);
  if (source) {
    const excerpt = doc.createElement("pre");
    excerpt.className = "slex-tiptap-error-source";
    excerpt.textContent = source;
    alert.append(excerpt);
  }
  container.replaceChildren(alert);
}

class PlainCodeBlockNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  constructor(node: ProseMirrorNode, doc: Document) {
    const language = codeBlockLanguage(node);
    this.dom = doc.createElement("pre");
    this.dom.className = "slex-tiptap-code-block";
    this.contentDOM = doc.createElement("code");
    if (language) this.contentDOM.className = `language-${language}`;
    this.dom.append(this.contentDOM);
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type.name !== "codeBlock" || codeBlockLanguage(node) === "slex") return false;
    const language = codeBlockLanguage(node);
    this.contentDOM.className = language ? `language-${language}` : "";
    return true;
  }
}

class SlexKitCodeBlockNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private readonly artifactId: string;
  private readonly editor: Editor;
  private readonly options: SlexKitTiptapNodeViewOptions;
  private readonly preview: HTMLElement;
  private readonly runtime: TiptapArtifactRuntime;
  private readonly interactiveObserver: MutationObserver | undefined;
  private renderToken = 0;

  constructor(private node: ProseMirrorNode, props: NodeViewRendererProps, options: SlexKitTiptapNodeViewOptions) {
    this.options = options;
    this.editor = props.editor;
    this.artifactId = resolveArtifactId(props.editor, options.artifactId);
    this.runtime = resolveArtifactRuntime(props.editor, this.artifactId, options.runtimeHost);
    this.runtime.views.add(this);

    const doc = props.view.dom.ownerDocument || document;
    this.dom = createElement(doc, "div", ["slex-tiptap-block", options.className].filter(Boolean).join(" "));
    this.dom.dataset.language = "slex";
    this.dom.setAttribute("data-slexkit-tiptap", "true");

    const label = options.previewLabel.trim() ? createElement(doc, "div", "slex-tiptap-label") : undefined;
    if (label) label.textContent = options.previewLabel;

    this.preview = createElement(doc, "div", "slex-tiptap-preview");
    this.preview.setAttribute("contenteditable", "false");
    this.preview.addEventListener("pointerdown", focusPreviewInteractiveTarget, { capture: true });
    this.preview.addEventListener("mousedown", focusPreviewInteractiveTarget, { capture: true });
    this.preview.addEventListener("click", focusPreviewInteractiveTarget, { capture: true });
    if (typeof MutationObserver !== "undefined") {
      this.interactiveObserver = new MutationObserver(() => schedulePreviewInteractiveMark(this.preview));
      this.interactiveObserver.observe(this.preview, { childList: true, subtree: true });
    }

    this.contentDOM = doc.createElement("code");
    this.contentDOM.className = "language-slex";

    const pre = doc.createElement("pre");
    pre.append(this.contentDOM);

    if (options.showSource) {
      const openStateKey = sourceOpenStateKey(this.artifactId, node);
      const sourceShell = createElement(doc, "div", "slex-tiptap-source");
      const sourceToggle = doc.createElement("button");
      sourceToggle.type = "button";
      sourceToggle.className = "slex-tiptap-source-toggle slex-tiptap-source-summary";
      sourceToggle.textContent = options.sourceLabel;
      sourceToggle.setAttribute("aria-expanded", "false");
      let sourceOpen = sourceOpenStates.get(openStateKey) ?? false;
      const setSourceOpen = (open: boolean) => {
        sourceOpen = open;
        sourceOpenStates.set(openStateKey, open);
        pre.hidden = !open;
        sourceShell.dataset.open = open ? "true" : "false";
        sourceToggle.setAttribute("aria-expanded", String(open));
        for (const delay of [0, 16, 50, 100, 200]) {
          sourceShell.ownerDocument.defaultView?.setTimeout(() => {
            pre.hidden = !sourceOpen;
            sourceShell.dataset.open = sourceOpen ? "true" : "false";
            sourceToggle.setAttribute("aria-expanded", String(sourceOpen));
          }, delay);
        }
      };
      const enforceSourceOpen = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        setSourceOpen(!sourceOpen);
      };
      const stopSourceClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
      };
      stopProseMirrorEvents(sourceToggle, ["mousedown", "keydown"]);
      sourceToggle.addEventListener("pointerdown", enforceSourceOpen, { capture: true });
      sourceToggle.addEventListener("click", stopSourceClick, { capture: true });
      setSourceOpen(sourceOpen);
      sourceShell.append(sourceToggle, pre);
      this.dom.append(...[label, this.preview, sourceShell].filter((element): element is HTMLElement => !!element));
    } else {
      const sourceShell = createElement(doc, "div", "slex-tiptap-source slex-tiptap-source-hidden");
      sourceShell.hidden = true;
      sourceShell.append(pre);
      this.dom.append(...[label, this.preview, sourceShell].filter((element): element is HTMLElement => !!element));
    }

    scheduleArtifactRender(this.runtime);
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type.name !== "codeBlock" || codeBlockLanguage(node) !== "slex") return false;
    this.node = node;
    this.renderSoon();
    return true;
  }

  destroy(): void {
    this.interactiveObserver?.disconnect();
    this.preview.replaceChildren();
    unregisterArtifactRuntime(this.editor, this.runtime, this);
  }

  stopEvent(event: Event): boolean {
    const target = event.target;
    if (!(target instanceof Node)) return false;

    if (this.preview.contains(target)) return true;

    const targetElement = target instanceof HTMLElement ? target : target.parentElement;
    if (targetElement?.closest(".slex-tiptap-source-summary")) {
      return true;
    }

    return false;
  }

  ignoreMutation(mutation: NodeViewMutationRecord): boolean {
    const target = mutation.target;
    if (this.preview.contains(target)) return true;
    if (target === this.contentDOM || this.contentDOM.contains(target)) return false;

    const targetElement = target instanceof Element ? target : target.parentElement;
    if (targetElement?.closest(".slex-tiptap-source")) return true;

    return false;
  }

  private source(): string {
    return this.node.textContent;
  }

  private renderSoon(): void {
    const token = ++this.renderToken;
    queueMicrotask(() => {
      if (token !== this.renderToken) return;
      scheduleArtifactRender(this.runtime);
    });
  }

  renderWithRuntime(runtimeHost: SlexKitMarkdownRuntimeHost): void {
    const source = this.source();
    this.dom.hidden = false;
    this.preview.hidden = false;
    this.preview.replaceChildren();

    const parsed = parseSlexSource(source);
    if (!parsed.ok) {
      renderError(parsed.error, source, this.preview);
      this.options.onError?.(parsed.error, source);
      return;
    }

    try {
      runtimeHost.mountBlock({
        artifactId: this.artifactId,
        source,
        container: this.preview,
        theme: this.options.theme,
      });
      schedulePreviewInteractiveMark(this.preview);
    } catch (error) {
      renderError(error, source, this.preview);
      this.options.onError?.(error, source);
      return;
    }

    if (isStateOnlySource(parsed.value) && !this.preview.querySelector(".slexkit-root")) {
      if (!this.options.showSource) {
        this.dom.hidden = true;
        this.preview.hidden = true;
        return;
      }
      const placeholder = createElement(this.preview.ownerDocument || document, "div", "slex-tiptap-state");
      placeholder.textContent = "State block";
      this.preview.append(placeholder);
    }
  }
}

export function createSlexKitTiptapExtension(options: SlexKitTiptapOptions = {}) {
  const resolvedOptions: SlexKitTiptapNodeViewOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return CodeBlock.extend({
    addNodeView() {
      return (props) => {
        const doc = props.view.dom.ownerDocument || document;
        if (codeBlockLanguage(props.node) !== "slex") {
          return new PlainCodeBlockNodeView(props.node, doc);
        }
        return new SlexKitCodeBlockNodeView(props.node, props, resolvedOptions);
      };
    },
  });
}

export const SlexKitTiptapExtension = createSlexKitTiptapExtension();
