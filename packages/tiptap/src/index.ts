import type { Editor, NodeViewRendererProps } from "@tiptap/core";
import CodeBlock from "@tiptap/extension-code-block";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { NodeView } from "@tiptap/pm/view";
import {
  createSlexKitMarkdownRuntimeHost,
  inspectSlexSource,
  type SlexKitMarkdownBlock,
  type SlexKitMarkdownRuntimeHost,
  type HtmlTheme,
} from "slexkit";

export type SlexKitTiptapOptions = {
  artifactId?: string | ((ctx: { editor: Editor }) => string);
  runtimeHost?: SlexKitMarkdownRuntimeHost;
  theme?: HtmlTheme;
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

const TRANSIENT_POINTER_INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input[type='button']",
  "input[type='checkbox']",
  "input[type='image']",
  "input[type='radio']",
  "input[type='range']",
  "input[type='reset']",
  "input[type='submit']",
  "[role='button']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='slider']",
  "[role='switch']",
  "[role='tab']",
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
  pending: Promise<void>;
  nextBlockId: number;
  disposed?: boolean;
};

type IncrementalRuntimeHost = SlexKitMarkdownRuntimeHost & {
  updateArtifact(
    artifactId: string,
    blocks: readonly SlexKitMarkdownBlock[],
    options: { phase: "preview" | "commit"; reset?: boolean },
  ): Promise<void>;
  resetArtifact(artifactId: string): Promise<void>;
};

function isIncrementalRuntimeHost(
  host: SlexKitMarkdownRuntimeHost,
): host is IncrementalRuntimeHost {
  const candidate = host as Partial<IncrementalRuntimeHost>;
  return typeof candidate.updateArtifact === "function"
    && typeof candidate.resetArtifact === "function";
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
      pending: Promise.resolve(),
      nextBlockId: 0,
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
    const views = Array.from(runtime.views).sort(compareNodeViewOrder);
    if (isIncrementalRuntimeHost(runtime.runtimeHost)) {
      const prepared = views.map((view) => view.prepareIncrementalRender());
      const phase = prepared.every((entry) => entry.valid)
        ? "commit"
        : "preview";
      const host = runtime.runtimeHost;
      const update = async () => {
        if (runtime.disposed) return;
        try {
          await host.updateArtifact(
            runtime.artifactId,
            prepared.map((entry) => entry.block),
            { phase },
          );
          if (phase === "commit") {
            for (const entry of prepared) {
              entry.view.finishIncrementalRender();
            }
          }
        } catch (error) {
          if (phase === "commit") {
            for (const entry of prepared) {
              entry.view.reportIncrementalError(error);
            }
          }
        }
      };
      runtime.pending = runtime.pending.then(update, update);
      return;
    }

    for (const view of views) {
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

  runtime.disposed = true;
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

function focusPreviewInteractiveTarget(event: Event): HTMLElement | null {
  const target = event.target;
  const targetElement = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  const interactive = targetElement?.closest(PREVIEW_INTERACTIVE_SELECTOR);
  if (!(interactive instanceof HTMLElement)) return null;

  interactive.focus({ preventScroll: true });
  return interactive;
}

function shouldRestorePreviewFocusAfterPointer(element: HTMLElement): boolean {
  return !!element.closest(TRANSIENT_POINTER_INTERACTIVE_SELECTOR);
}

function pointerIdFromEvent(event: Event | undefined): number | undefined {
  const pointerEvent = event as (Event & { pointerId?: unknown }) | undefined;
  return typeof pointerEvent?.pointerId === "number" ? pointerEvent.pointerId : undefined;
}

function markPreviewInteractive(preview: HTMLElement, force = false): void {
  if (preview.getAttribute("contenteditable") !== "false") {
    preview.setAttribute("contenteditable", "false");
  }

  preview.querySelectorAll(PREVIEW_INTERACTIVE_SELECTOR).forEach((element) => {
    if (element instanceof HTMLElement && (force || element.getAttribute("contenteditable") !== "true")) {
      if (force && !element.contains(preview.ownerDocument.activeElement)) element.removeAttribute("contenteditable");
      element.setAttribute("contenteditable", "true");
    }
  });
}

const previewMarks = new WeakMap<HTMLElement, { cancelled: boolean; timer?: number; frame?: number }>();

function cancelPreviewInteractiveMark(preview: HTMLElement): void {
  const pending = previewMarks.get(preview);
  if (!pending) return;
  pending.cancelled = true;
  if (pending.timer !== undefined) preview.ownerDocument.defaultView?.clearTimeout(pending.timer);
  if (pending.frame !== undefined) preview.ownerDocument.defaultView?.cancelAnimationFrame(pending.frame);
  previewMarks.delete(preview);
}

function schedulePreviewInteractiveMark(preview: HTMLElement): void {
  markPreviewInteractive(preview);
  if (previewMarks.has(preview)) return;
  const pending: {cancelled:boolean;timer?:number;frame?:number} = {cancelled:false};
  previewMarks.set(preview, pending);
  const mark = () => { if (!pending.cancelled) markPreviewInteractive(preview, true); };
  queueMicrotask(mark);
  const win = preview.ownerDocument.defaultView;
  pending.timer = win?.setTimeout(() => {pending.timer=undefined;mark();if(pending.frame===undefined)previewMarks.delete(preview);}, 0);
  pending.frame = win?.requestAnimationFrame(() => {pending.frame=undefined;mark();if(pending.timer===undefined)previewMarks.delete(preview);});
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
  private readonly diagnostic: HTMLElement;
  private readonly runtime: TiptapArtifactRuntime;
  private readonly blockId: string;
  private readonly interactiveObserver: MutationObserver | undefined;
  private pendingFocusRestore:
    | { target: HTMLElement; restoreEditor: boolean; pointerId: number | null }
    | undefined;
  private pointerFocusContext: { restoreEditor: boolean; expiresAt: number; scope?: Element } | undefined;
  private focusTimers = new Set<number>();
  private focusFrames = new Set<number>();
  private readonly clearKeyboardPointerIntent = (): void => {
    this.pointerFocusContext = undefined;
    this.pendingFocusRestore = undefined;
    this.removeFocusRestoreListeners();
    this.cancelFocusWork();
  };

  private cancelFocusWork(): void {
    const win = this.preview.ownerDocument.defaultView;
    for (const timer of this.focusTimers) win?.clearTimeout(timer);
    for (const frame of this.focusFrames) win?.cancelAnimationFrame(frame);
    this.focusTimers.clear(); this.focusFrames.clear();
  }
  private renderToken = 0;

  private readonly focusPreviewPointerTarget = (event: PointerEvent): void => {
    const restoreEditor = this.editor.isFocused;
    const interactive = focusPreviewInteractiveTarget(event);
    this.pointerFocusContext = { restoreEditor, expiresAt: Date.now() + 500,
      scope: interactive?.closest(".slex-select,.slex-checkbox,.slex-switch,.slex-tabs") ?? interactive ?? undefined };
    if (!interactive || !shouldRestorePreviewFocusAfterPointer(interactive)) return;

    this.pendingFocusRestore = {
      target: interactive,
      restoreEditor,
      pointerId: typeof event.pointerId === "number" ? event.pointerId : null,
    };
    this.addFocusRestoreListeners();
  };

  private readonly clearPointerFocusedPreviewTarget = (event: Event): void => {
    const context = this.pointerFocusContext;
    if (!context || Date.now() > context.expiresAt) return;

    const target = event.target;
    const targetElement = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
    const interactive = targetElement?.closest(TRANSIENT_POINTER_INTERACTIVE_SELECTOR);
    if (!(interactive instanceof HTMLElement)) return;
    if (context.scope && !context.scope.contains(interactive)) return;
    if (this.pendingFocusRestore?.target === interactive) return;

    this.queuePreviewFocusCleanup({
      target: interactive,
      restoreEditor: context.restoreEditor,
    });
  };

  private readonly finishPreviewPointerFocus = (event?: Event): void => {
    const pending = this.pendingFocusRestore;
    if (!pending) return;
    const pointerId = pointerIdFromEvent(event);
    if (
      pointerId !== undefined
      && pending.pointerId !== null
      && pointerId !== pending.pointerId
    ) {
      return;
    }

    this.pendingFocusRestore = undefined;
    this.removeFocusRestoreListeners();

    this.queuePreviewFocusCleanup(pending);
  };

  private queuePreviewFocusCleanup(pending: { target: HTMLElement; restoreEditor: boolean }): void {
    const doc = this.preview.ownerDocument || document;
    const win = doc.defaultView;
    const cleanupFocus = () => {
      if (!this.dom.isConnected) return;
      const active = doc.activeElement;
      const clearedTarget = active === pending.target;
      if (clearedTarget) pending.target.blur();
      const nextActive = doc.activeElement;
      const canRestoreEditor = pending.restoreEditor
        && !this.editor.isDestroyed
        && (clearedTarget || nextActive === doc.body || nextActive === doc.documentElement);
      if (canRestoreEditor) {
        this.editor.commands.focus(undefined, { scrollIntoView: false });
      }
    };
    if (!win) return;
    for (const ms of [0, 50]) {
      const timer = win.setTimeout(() => { this.focusTimers.delete(timer); cleanupFocus(); }, ms);
      this.focusTimers.add(timer);
    }
    const frame = win.requestAnimationFrame(() => { this.focusFrames.delete(frame); cleanupFocus(); });
    this.focusFrames.add(frame);
  }

  private readonly cancelPreviewPointerFocus = (event?: Event): void => {
    this.finishPreviewPointerFocus(event);
  };

  constructor(private node: ProseMirrorNode, props: NodeViewRendererProps, options: SlexKitTiptapNodeViewOptions) {
    this.options = options;
    this.editor = props.editor;
    this.artifactId = resolveArtifactId(props.editor, options.artifactId);
    this.runtime = resolveArtifactRuntime(props.editor, this.artifactId, options.runtimeHost);
    this.blockId = `tiptap-block-${++this.runtime.nextBlockId}`;
    this.runtime.views.add(this);

    const doc = props.view.dom.ownerDocument || document;
    this.dom = createElement(doc, "div", ["slex-tiptap-block", options.className].filter(Boolean).join(" "));
    this.dom.dataset.language = "slex";
    this.dom.setAttribute("data-slexkit-tiptap", "true");

    const label = options.previewLabel.trim() ? createElement(doc, "div", "slex-tiptap-label") : undefined;
    if (label) label.textContent = options.previewLabel;

    this.preview = createElement(doc, "div", "slex-tiptap-preview");
    this.diagnostic = createElement(doc, "div", "slex-tiptap-diagnostic");
    this.preview.setAttribute("contenteditable", "false");
    doc.addEventListener("keydown", this.clearKeyboardPointerIntent, { capture: true });
    this.preview.addEventListener("pointerdown", this.focusPreviewPointerTarget, { capture: true });
    this.preview.addEventListener("focusin", this.clearPointerFocusedPreviewTarget, { capture: true });
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
      this.dom.append(...[label, this.diagnostic, this.preview, sourceShell].filter((element): element is HTMLElement => !!element));
    } else {
      const sourceShell = createElement(doc, "div", "slex-tiptap-source slex-tiptap-source-hidden");
      sourceShell.hidden = true;
      sourceShell.append(pre);
      this.dom.append(...[label, this.diagnostic, this.preview, sourceShell].filter((element): element is HTMLElement => !!element));
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
    this.renderToken += 1;
    this.cancelFocusWork();
    this.preview.ownerDocument.removeEventListener("keydown", this.clearKeyboardPointerIntent, { capture: true });
    cancelPreviewInteractiveMark(this.preview);
    this.interactiveObserver?.disconnect();
    this.removeFocusRestoreListeners();
    this.preview.removeEventListener("pointerdown", this.focusPreviewPointerTarget, { capture: true });
    this.preview.removeEventListener("mousedown", focusPreviewInteractiveTarget, { capture: true });
    this.preview.removeEventListener("click", focusPreviewInteractiveTarget, { capture: true });
    this.preview.removeEventListener("focusin", this.clearPointerFocusedPreviewTarget, { capture: true });
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
    if (this.diagnostic.contains(target)) return true;
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

  private addFocusRestoreListeners(): void {
    const doc = this.preview.ownerDocument || document;
    doc.addEventListener("pointerup", this.finishPreviewPointerFocus, { capture: true });
    doc.addEventListener("pointercancel", this.cancelPreviewPointerFocus, { capture: true });
    doc.defaultView?.addEventListener("blur", this.cancelPreviewPointerFocus);
  }

  private removeFocusRestoreListeners(): void {
    const doc = this.preview.ownerDocument || document;
    doc.removeEventListener("pointerup", this.finishPreviewPointerFocus, { capture: true });
    doc.removeEventListener("pointercancel", this.cancelPreviewPointerFocus, { capture: true });
    doc.defaultView?.removeEventListener("blur", this.cancelPreviewPointerFocus);
  }

  renderWithRuntime(runtimeHost: SlexKitMarkdownRuntimeHost): void {
    const source = this.source();
    this.dom.hidden = false;
    this.preview.hidden = false;
    const inspected = inspectSlexSource(source);
    if (!inspected.ok) {
      renderError(inspected.error, source, this.diagnostic);
      this.options.onError?.(inspected.error, source);
      return;
    }

    try {
      runtimeHost.disposeBlock(this.preview);
      runtimeHost.mountBlock({
        artifactId: this.artifactId,
        blockId: this.blockId,
        source,
        container: this.preview,
        theme: this.options.theme,
      });
      this.diagnostic.replaceChildren();
      schedulePreviewInteractiveMark(this.preview);
    } catch (error) {
      renderError(error, source, this.diagnostic);
      this.options.onError?.(error, source);
      return;
    }

  }

  prepareIncrementalRender(): {
    view: SlexKitCodeBlockNodeView;
    block: SlexKitMarkdownBlock;
    valid: boolean;
  } {
    const source = this.source();
    const inspected = inspectSlexSource(source);

    if (inspected.ok) {
      this.diagnostic.replaceChildren();
    } else {
      renderError(inspected.error, source, this.diagnostic);
      this.options.onError?.(inspected.error, source);
    }

    return {
      view: this,
      block: {
        artifactId: this.artifactId,
        blockId: this.blockId,
        source,
        container: this.preview,
        theme: this.options.theme,
      },
      valid: inspected.ok,
    };
  }

  finishIncrementalRender(): void {
    this.dom.hidden = false;
    this.preview.hidden = false;
    this.diagnostic.replaceChildren();
    schedulePreviewInteractiveMark(this.preview);
  }

  reportIncrementalError(error: unknown): void {
    const source = this.source();
    renderError(error, source, this.diagnostic);
    this.options.onError?.(error, source);
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
