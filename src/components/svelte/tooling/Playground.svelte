<script lang="ts">
  import { onMount } from "svelte";
  import { mount as mountSvelte, unmount } from "svelte";
  import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
  } from "@codemirror/autocomplete";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import {
    bracketMatching,
    defaultHighlightStyle,
    foldGutter,
    foldKeymap,
    indentOnInput,
    syntaxHighlighting,
  } from "@codemirror/language";
  import { lintKeymap } from "@codemirror/lint";
  import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
  import { EditorState } from "@codemirror/state";
  import {
    crosshairCursor,
    drawSelection,
    dropCursor,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
    type EditorView,
  } from "@codemirror/view";
  import type { SlexExpression, RenderContext } from "../../../engine/types";
  import { mount as mountSlexKit, parseSlexSource } from "../../../engine/index";
  import { bindPropStore } from "../bindProps";
  import { stringifySource, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";
  import Button from "../input/Button.svelte";
  import Select from "../input/Select.svelte";
  import Tabs from "../input/Tabs.svelte";
  import CodeMirror from "./CodeMirror.svelte";
  import PlaygroundMarkdown from "./PlaygroundMarkdown.svelte";

  type PlaygroundMode = "code" | "live" | "render";
  type SourceKind = "markdown" | "slex";
  type Diagnostic =
    | { ok: true }
    | {
        ok: false;
        block: number;
        message: string;
        editorLine: number;
        column: number;
        detail?: string;
        excerpt?: string;
      };

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let mode = $state<PlaygroundMode>("render");
  let source = $state("");
  let previewSource = $state("");
  let sourceType = $state<SourceKind>("markdown");
  let lastSource = "";
  let editorView = $state<EditorView | null>(null);
  let playgroundNode = $state<HTMLElement | null>(null);
  let previewNode = $state<HTMLElement | null>(null);
  let previewOverflow = $state(false);
  let previewAnchorFixed = $state(false);
  let previewAnchorOffset = $state(0);
  let compact = $state(false);
  let splitPercent = $state(48);
  let configuredMode = "";
  let configuredSplit = "";
  let configuredSourceType = "";
  let dragging = $state(false);
  let currentTheme = $state<"light" | "dark">("light");
  let splitSurface: HTMLElement | null = null;
  let activeDragPointerId: number | null = null;
  let previewOverflowFrame = 0;
  const themeStorageKey = "slexkit:theme";

  const modeItems: Array<{ id: PlaygroundMode; label: string; icon: string }> = [
    { id: "render", label: "Render", icon: "eye" },
    { id: "live", label: "Live", icon: "square-split-horizontal" },
    { id: "code", label: "Code", icon: "code" },
  ];
  const sourceTypeItems = [
    { label: "Markdown", value: "markdown" },
    { label: "SLEX", value: "slex" },
  ];

  const basicEditorSetup = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
  ];
  const slexLanguage = javascript();
  const javascriptEditorExtensions = [
    basicEditorSetup,
    slexLanguage,
  ];
  const markdownEditorExtensions = [
    basicEditorSetup,
    markdown({
      base: markdownLanguage,
      codeLanguages: (info) => {
        const language = info.trim().toLowerCase().split(/\s+/, 1)[0];
        return isSlexLanguage(language)
          ? javascriptLanguage
          : null;
      },
      defaultCodeLanguage: slexLanguage,
    }),
  ];
  const editorExtensions = $derived(sourceType === "slex" ? javascriptEditorExtensions : markdownEditorExtensions);

  $effect(() => bindPropStore(props, (next) => {
    p = next;
    const nextSource = stringifySource(next.source);
    const sourceChanged = nextSource !== lastSource;
    if (sourceChanged) {
      source = nextSource;
      previewSource = nextSource;
      lastSource = nextSource;
      resetPreviewAnchor();
    }
    const nextSourceType = text(next.sourceType ?? next.type, "");
    if (nextSourceType !== configuredSourceType || (!nextSourceType && sourceChanged)) {
      configuredSourceType = nextSourceType;
      sourceType = normalizeSourceKind(nextSourceType, nextSource);
    }
    const nextMode = text(next.mode ?? next.webMode, "");
    if (nextMode !== configuredMode) {
      configuredMode = nextMode;
      if (nextMode) mode = normalizeMode(nextMode);
    }
    const nextSplit = text(next.splitPercent ?? next.split, "");
    if (nextSplit !== configuredSplit) {
      configuredSplit = nextSplit;
      const parsed = Number(nextSplit);
      if (Number.isFinite(parsed)) {
        splitPercent = Math.min(72, Math.max(18, parsed));
      }
    }
  }));

  $effect(() => {
    const next = source;
    const timer = window.setTimeout(() => {
      previewSource = next;
    }, 300);
    return () => window.clearTimeout(timer);
  });

  $effect(() => {
    if (mode !== "live" || !editorView || !previewNode) return;
    const codeScroller = editorView.scrollDOM;
    const previewScroller = previewNode;
    let syncing = false;

    const sync = (sourceNode: HTMLElement, targetNode: HTMLElement) => {
      if (syncing) return;
      const sourceMax = Math.max(0, sourceNode.scrollHeight - sourceNode.clientHeight);
      const targetMax = Math.max(0, targetNode.scrollHeight - targetNode.clientHeight);
      if (!sourceMax || !targetMax) return;
      syncing = true;
      targetNode.scrollTop = (sourceNode.scrollTop / sourceMax) * targetMax;
      window.requestAnimationFrame(() => {
        syncing = false;
      });
    };

    const syncPreview = () => sync(codeScroller, previewScroller);
    const syncCode = () => sync(previewScroller, codeScroller);
    codeScroller.addEventListener("scroll", syncPreview, { passive: true });
    previewScroller.addEventListener("scroll", syncCode, { passive: true });
    return () => {
      codeScroller.removeEventListener("scroll", syncPreview);
      previewScroller.removeEventListener("scroll", syncCode);
    };
  });

  $effect(() => {
    const node = previewNode;
    if (!node) {
      previewOverflow = false;
      return;
    }

    schedulePreviewOverflowMeasure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(schedulePreviewOverflowMeasure);
    observer.observe(node);
    const container = previewScrollContainer();
    if (container && container !== node) observer.observe(container);
    const mutationObserver = new MutationObserver(schedulePreviewOverflowMeasure);
    mutationObserver.observe(node, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      if (previewOverflowFrame) {
        window.cancelAnimationFrame(previewOverflowFrame);
        previewOverflowFrame = 0;
      }
    };
  });

  onMount(() => {
    currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const media = window.matchMedia("(max-width: 640px)");
    const updateCompact = () => {
      const width = playgroundNode?.getBoundingClientRect().width ?? 0;
      compact = media.matches || (width > 0 && width <= 640);
    };
    const cancelDrag = () => {
      endDrag();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateCompact);
    updateCompact();
    media.addEventListener("change", updateCompact);
    window.addEventListener("resize", updateCompact);
    if (playgroundNode) observer?.observe(playgroundNode);
    window.addEventListener("pointerup", cancelDrag);
    window.addEventListener("pointercancel", cancelDrag);
    window.addEventListener("blur", cancelDrag);
    document.addEventListener("visibilitychange", cancelDrag);

    return () => {
      media.removeEventListener("change", updateCompact);
      window.removeEventListener("resize", updateCompact);
      observer?.disconnect();
      window.removeEventListener("pointerup", cancelDrag);
      window.removeEventListener("pointercancel", cancelDrag);
      window.removeEventListener("blur", cancelDrag);
      document.removeEventListener("visibilitychange", cancelDrag);
    };
  });

  function themeToggleEnabled(): boolean {
    const value = p.themeToggle ?? p.showThemeToggle ?? p.enableThemeToggle;
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function normalizeMode(value: string): PlaygroundMode {
    const raw = value.trim().toLowerCase();
    if (raw === "code" || raw === "script" || raw === "editor") return "code";
    if (raw === "render" || raw === "preview") return "render";
    if (raw === "live" || raw === "split" || raw === "both") return "live";
    return "render";
  }

  function normalizePreviewAlign(value: string): "center" | "start" {
    const raw = value.trim().toLowerCase();
    return raw === "start" || raw === "top" ? "start" : "center";
  }

  function resolvedPreviewAlign(): "center" | "start" {
    const explicit = text(p.previewAlign ?? p.alignPreview ?? p.previewPlacement, "");
    if (explicit) return normalizePreviewAlign(explicit);
    return sourceType === "markdown" ? "start" : "center";
  }

  function sourceSelectProps() {
    return {
      subscribe(run: (value: PropValues) => void) {
        run({
          value: sourceType,
          variant: "toolbar",
          options: sourceTypeItems,
          "aria-label": text(p.sourceTypeLabel, "Source type"),
        });
        return () => {};
      },
    };
  }

  function viewTabsProps() {
    return {
      subscribe(run: (value: PropValues) => void) {
        run({
          value: mode,
          tabs: modeItems.map((item) => ({
            value: item.id,
            label: item.label,
            icon: item.icon,
            iconOnly: true,
            title: item.label,
          })),
        });
        return () => {};
      },
    };
  }

  function viewTabsCtx(): RenderContext {
    return {
      ...ctx,
      emit(eventName, data) {
        if (eventName === "change") {
          const nextMode = normalizeMode(text(data));
          if (nextMode !== mode) resetPreviewAnchor();
          mode = nextMode;
          return;
        }
        ctx.emit(eventName, data);
      },
    };
  }

  function actionButtonProps(action: "theme" | "web" | "copy") {
    return {
      subscribe(run: (value: PropValues) => void) {
        run(action === "theme"
          ? {
              variant: "ghost",
              icon: currentTheme === "dark" ? "sun" : "moon",
              iconOnly: true,
              pressed: currentTheme === "dark",
              title: text(p.themeLabel ?? p.themeToggleLabel, "Toggle theme"),
              "aria-label": text(p.themeLabel ?? p.themeToggleLabel, "Toggle theme"),
            }
          : action === "web"
          ? {
              variant: "ghost",
              icon: "arrow-square-out",
              iconOnly: true,
              title: text(p.openWebLabel, "Open in playground"),
              "aria-label": text(p.openWebLabel, "Open in playground"),
            }
          : {
              variant: "ghost",
              icon: "copy",
              iconOnly: true,
              title: text(p.copyLabel, "Copy source"),
              "aria-label": text(p.copyLabel, "Copy source"),
            });
        return () => {};
      },
    };
  }

  function actionButtonCtx(action: "theme" | "web" | "copy"): RenderContext {
    return {
      ...ctx,
      emit(eventName, data) {
        if (eventName === "click") {
          if (action === "theme") toggleTheme();
          else if (action === "web") openWeb();
          else void copySource();
          return;
        }
        ctx.emit(eventName, data);
      },
    };
  }

  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    currentTheme = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage?.setItem(themeStorageKey, next);
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  }

  function sourceSelectCtx(): RenderContext {
    return {
      ...ctx,
      emit(eventName, data) {
        if (eventName === "change" || eventName === "select") {
          const nextSourceType = normalizeSourceKind(text(data), source);
          if (nextSourceType !== sourceType) resetPreviewAnchor();
          sourceType = nextSourceType;
          return;
        }
        ctx.emit(eventName, data);
      },
    };
  }

  function openWeb() {
    const base = text(p.webUrl ?? p.playgroundUrl, "/playground.html");
    const url = new URL(base, window.location.href);
    url.searchParams.set("srcs", source);
    url.searchParams.set("type", sourceType);
    url.searchParams.set("mode", mode);
    const domain = text(p.domain);
    const pluginVersion = text(p.pluginVersion ?? p.version);
    if (domain) url.searchParams.set("domain", domain);
    if (pluginVersion) url.searchParams.set("pluginVersion", pluginVersion);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  async function copySource() {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(source);
        return;
      } catch {
        // Fall back for non-secure origins or denied clipboard permissions.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = source;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function startDrag(event: PointerEvent) {
    if (!splitSurface) return;
    event.preventDefault();
    activeDragPointerId = typeof event.pointerId === "number" ? event.pointerId : null;
    dragging = true;
    if (typeof splitSurface.setPointerCapture !== "function") return;
    try {
      splitSurface.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the browser has already cancelled the pointer.
    }
  }

  function updateDrag(event: PointerEvent) {
    if (!dragging || !splitSurface) return;
    const rect = splitSurface.getBoundingClientRect();
    const raw = compact
      ? ((event.clientY - rect.top) / rect.height) * 100
      : ((event.clientX - rect.left) / rect.width) * 100;
    splitPercent = Math.min(72, Math.max(18, raw));
  }

  function endDrag(event?: PointerEvent) {
    const pointerId = event?.pointerId ?? activeDragPointerId;
    dragging = false;
    activeDragPointerId = null;
    if (
      splitSurface
      && pointerId !== null
      && typeof splitSurface.hasPointerCapture === "function"
      && typeof splitSurface.releasePointerCapture === "function"
      && splitSurface.hasPointerCapture(pointerId)
    ) {
      splitSurface.releasePointerCapture(pointerId);
    }
  }

  function splitStyle() {
    return compact
      ? `grid-template-rows:${splitPercent}% 8px minmax(0, 1fr);`
      : `grid-template-columns:${splitPercent}% 8px minmax(0, 1fr);`;
  }

  function previewScrollContainer() {
    if (!previewNode) return null;
    return mode === "render" ? previewNode.parentElement as HTMLElement | null : previewNode;
  }

  function resetPreviewAnchor() {
    previewAnchorFixed = false;
    previewAnchorOffset = 0;
  }

  function capturePreviewAnchor() {
    if (!previewNode || previewOverflow || resolvedPreviewAlign() !== "center") return;
    const container = previewScrollContainer();
    if (!container) return;
    const target = (mode === "render" ? previewNode : previewNode.firstElementChild) as HTMLElement | null;
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const styles = window.getComputedStyle(container);
    const paddingTop = Number.parseFloat(styles.paddingTop || "0");
    previewAnchorOffset = Math.max(0, targetRect.top - containerRect.top - paddingTop + container.scrollTop);
    previewAnchorFixed = true;
  }

  function measurePreviewOverflow() {
    if (!previewNode) {
      previewOverflow = false;
      return;
    }

    const container = previewScrollContainer();
    if (!container) {
      previewOverflow = false;
      return;
    }

    const content = previewNode.firstElementChild instanceof HTMLElement
      ? previewNode.firstElementChild
      : previewNode;
    const styles = window.getComputedStyle(container);
    const availableHeight = Math.max(
      0,
      container.clientHeight - Number.parseFloat(styles.paddingTop || "0") - Number.parseFloat(styles.paddingBottom || "0"),
    );
    const availableWidth = Math.max(
      0,
      container.clientWidth - Number.parseFloat(styles.paddingLeft || "0") - Number.parseFloat(styles.paddingRight || "0"),
    );

    previewOverflow = content.scrollHeight > availableHeight + 1 || content.scrollWidth > availableWidth + 1;
  }

  function schedulePreviewOverflowMeasure() {
    if (previewOverflowFrame) return;
    previewOverflowFrame = window.requestAnimationFrame(() => {
      previewOverflowFrame = 0;
      measurePreviewOverflow();
    });
  }

  function isSlexLanguage(language: string): boolean {
    return language === "slex";
  }

  function resolveSourceKind(value: string): "slex" | "markdown" {
    return sourceType;
  }

  function normalizeSourceKind(value: string, valueSource = source): SourceKind {
    const raw = value.trim().toLowerCase();
    if (raw === "markdown" || raw === "site-markdown" || raw === "md") return "markdown";
    if (isSlexLanguage(raw)) return "slex";
    return looksLikeSlexSource(valueSource) ? "slex" : "markdown";
  }

  function looksLikeSlexSource(value: string) {
    const raw = String(value ?? "").trim();
    if (!raw || /^(```|~~~)/.test(raw)) return false;
    if (!/^(?:export\s+default\s+)?\(?\s*\{/.test(raw)) return false;
    return /["']?(slex|namespace|layout|g)["']?\s*:/.test(raw);
  }

  function parseSlexDocuments(value: string) {
    const raw = String(value ?? "").trim();
    if (!raw) return { ok: true as const, value: [] as SlexExpression[] };
    const wrapped = raw.startsWith("[") ? raw : `[${raw}]`;
    const parsed = parseSlexSource(wrapped);
    if (!parsed.ok) return parsed;
    const valueList = Array.isArray(parsed.value) ? parsed.value : [parsed.value];
    return {
      ok: true as const,
      value: valueList.filter((item): item is SlexExpression => !!item && typeof item === "object") as SlexExpression[],
    };
  }

  function analyze(value: string): Diagnostic {
    const blocks = Array.from(value.matchAll(/(```|~~~)slex\s*\n([\s\S]*?)\n\1/g), (match, index) => {
      const code = match[2];
      const startIndex = (match.index ?? 0) + match[0].indexOf(code);
      return {
        code,
        index: index + 1,
        startLine: value.slice(0, startIndex).split("\n").length,
      };
    });
    const candidates = blocks.length
      ? blocks
      : looksLikeSlexSource(value)
        ? [{ code: value, index: 1, startLine: 1 }]
        : [];

    for (const block of candidates) {
      if (!block.code.trim()) continue;
      const parsed = parseSlexDocuments(block.code);
      if (!parsed.ok) {
        const diagnostic = parsed.diagnostic;
        return {
          ok: false,
          block: block.index,
          message: diagnostic.message,
          editorLine: block.startLine + diagnostic.line - 1,
          column: diagnostic.column,
          detail: diagnostic.detail ?? "",
          excerpt: diagnostic.excerpt,
        };
      }
    }
    return { ok: true };
  }

  function preview(node: HTMLElement) {
    let cleanup: (() => void) | undefined;
    let markdownApp: ReturnType<typeof mountSvelte> | undefined;
    let renderToken = 0;

    const renderNow = () => {
      cleanup?.();
      cleanup = undefined;
      if (markdownApp) {
        void unmount(markdownApp);
        markdownApp = undefined;
      }
      node.replaceChildren();

      const diagnostic = analyze(previewSource);
      if (!diagnostic.ok) {
        node.appendChild(syntaxErrorNode(diagnostic));
        schedulePreviewOverflowMeasure();
        return;
      }

      if (resolveSourceKind(previewSource) === "slex") {
        const host = previewInnerNode();
        node.appendChild(host);
        const parsed = parseSlexDocuments(previewSource);
        if (!parsed.ok) {
          node.replaceChildren();
          node.appendChild(syntaxErrorNode({
            ok: false,
            block: 1,
            message: parsed.diagnostic.message,
            editorLine: parsed.diagnostic.line,
            column: parsed.diagnostic.column,
            detail: parsed.diagnostic.detail ?? "",
            excerpt: parsed.diagnostic.excerpt,
          }));
          schedulePreviewOverflowMeasure();
          return;
        }
        const cleanups = parsed.value.map((script) => {
          const block = document.createElement("div");
          block.className = "slex-playground-document";
          host.appendChild(block);
          return mountSlexKit(script, block);
        });
        cleanup = () => {
          for (const dispose of cleanups) dispose();
        };
      } else {
        const host = previewInnerNode();
        node.appendChild(host);
        markdownApp = mountSvelte(PlaygroundMarkdown, {
          target: host,
          props: {
            content: previewSource,
            domain: text(p.domain, "playground"),
          },
        });
      }
      schedulePreviewOverflowMeasure();
    };

    const render = () => {
      const token = ++renderToken;
      queueMicrotask(() => {
        if (token !== renderToken) return;
        renderNow();
      });
    };

    render();
    return {
      update: render,
      destroy() {
        renderToken += 1;
        cleanup?.();
        if (markdownApp) void unmount(markdownApp);
        node.replaceChildren();
      },
    };
  }

  function syntaxErrorNode(diagnostic: Exclude<Diagnostic, { ok: true }>) {
    const wrapper = previewInnerNode();

    const panel = document.createElement("div");
    panel.className = "slex-standalone-playground-error";
    panel.setAttribute("role", "alert");
    panel.append(
      element("div", "slex-standalone-playground-error-title", "SlexKit syntax error"),
      element("div", "slex-standalone-playground-error-message", diagnostic.message),
      element("div", "slex-standalone-playground-error-location", `Block ${diagnostic.block}, editor line ${diagnostic.editorLine}, column ${diagnostic.column}`),
    );
    if (diagnostic.detail) {
      panel.appendChild(element("div", "slex-standalone-playground-error-detail", diagnostic.detail));
    }
    panel.appendChild(element("pre", "slex-standalone-playground-error-excerpt", diagnostic.excerpt ?? ""));
    wrapper.appendChild(panel);
    return wrapper;
  }

  function element(tag: string, className: string, content: string) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = content;
    return node;
  }

  function previewInnerNode() {
    const host = document.createElement("div");
    host.className = "slex-standalone-playground-preview-inner";
    const maxWidth = text(p.previewMaxWidth, "");
    if (maxWidth) host.style.maxWidth = maxWidth;
    return host;
  }
</script>

<section
  bind:this={playgroundNode}
  class={`slex-playground slex-playground--workbench${p.class ? ` ${text(p.class)}` : ""}`}
  data-mode={mode}
  data-source-type={sourceType}
  data-preview-align={resolvedPreviewAlign()}
  data-preview-overflow={previewOverflow ? "true" : "false"}
  data-preview-anchor={previewAnchorFixed ? "fixed" : "auto"}
  style={`--slex-playground-min-height:${text(p.previewMinHeight, "16rem")};--slex-preview-anchor-offset:${previewAnchorOffset}px;`}
>
  <h2 class="slex-playground-title slex-sr-only">{text(p.title, "Playground")}</h2>
  <div class="slex-playground-chrome">
    <div class="slex-playground-tabs" role="group" aria-label="Playground view">
      <Tabs componentName="tabs" ctx={viewTabsCtx()} props={viewTabsProps()} />
      <div class="slex-playground-source-picker">
        <Select componentName="select" ctx={sourceSelectCtx()} props={sourceSelectProps()} />
      </div>
    </div>

    <div class="slex-playground-actions">
      {#if themeToggleEnabled()}
        <Button componentName="button" ctx={actionButtonCtx("theme")} props={actionButtonProps("theme")} />
      {/if}
      <Button componentName="button" ctx={actionButtonCtx("web")} props={actionButtonProps("web")} />
      <Button componentName="button" ctx={actionButtonCtx("copy")} props={actionButtonProps("copy")} />
    </div>
  </div>

  {#if mode === "code"}
    <div class="slex-playground-code-pane">
      <div class="slex-playground-code">
        <CodeMirror
          class="slex-playground-editor"
          doc={source}
          extensions={editorExtensions}
          onChange={(value) => source = value}
          onEditorView={(view) => editorView = view}
        />
      </div>
    </div>
  {:else if mode === "render"}
    <div class="slex-playground-preview-pane" onpointerdowncapture={capturePreviewAnchor} onkeydowncapture={capturePreviewAnchor}>
      <div class="slex-playground-preview" bind:this={previewNode} use:preview={`${sourceType}:${previewSource}`}></div>
    </div>
  {:else}
    <div
      class={`slex-playground-live-pane ${compact ? "vertical" : "horizontal"}`}
      style={splitStyle()}
      bind:this={splitSurface}
      onpointermove={updateDrag}
      onpointerup={endDrag}
      onpointercancel={endDrag}
      onlostpointercapture={endDrag}
    >
      <div class="slex-playground-live-code">
        <div class="slex-playground-code">
          <CodeMirror
            class="slex-playground-editor"
            doc={source}
            extensions={editorExtensions}
            onChange={(value) => source = value}
            onEditorView={(view) => editorView = view}
          />
        </div>
      </div>
      <div
        class:dragging
        class="slex-playground-splitter"
        role="separator"
        tabindex="0"
        aria-orientation={compact ? "horizontal" : "vertical"}
        onpointerdown={startDrag}
      ></div>
      <div
        class="slex-playground-live-preview"
        bind:this={previewNode}
        use:preview={`${sourceType}:${previewSource}`}
        onpointerdowncapture={capturePreviewAnchor}
        onkeydowncapture={capturePreviewAnchor}
      ></div>
    </div>
  {/if}
</section>
