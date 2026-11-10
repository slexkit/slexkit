<script module lang="ts">
  let nextBlockId = 0;
  function createBlockId() {
    nextBlockId += 1;
    return `site-slex-${nextBlockId.toString(36)}`;
  }
</script>

<script lang="ts">
  import { onDestroy } from "svelte";
  import HighlightedMarkdownCode from "./HighlightedMarkdownCode.svelte";
  import { setPlaygroundSource } from "../playground/source-url.js";
  import { loadSlexKitRuntime, resolveSlexKitSandboxRuntimeUrl } from "./runtime-loader.js";
  import {
    removeSlexArtifactRegistration,
    updateSlexArtifactRegistration,
  } from "./slex-artifact-coordinator.js";
  import type {
    HostRuntimeAdapter,
    HostRuntimePolicy,
    SecureFrameOptions,
    SlexKitMarkdownBlock,
    SlexKitMarkdownRuntimeHost,
    SlexKitUpdatableMarkdownRuntimeHost,
  } from "slexkit";
  import type * as SlexKitRuntime from "slexkit";

  type RenderMode = "component" | "playground";
  type PreviewMode = "preview" | "live" | "code";
  type FenceOptions = Record<string, string>;
  type RuntimeModule = typeof SlexKitRuntime;
  type Props = {
    lang?: string;
    text?: string;
    domain?: string;
    renderMode?: RenderMode;
    runtime?: "trusted" | "secure";
    runtimeHost?: SlexKitMarkdownRuntimeHost;
    useGlobalRuntimeHost?: boolean;
    securePolicy?: HostRuntimePolicy;
    hostAdapter?: HostRuntimeAdapter;
    secureFrame?: boolean | SecureFrameOptions;
    playgroundUrl?: string;
    className?: string;
    streaming?: unknown;
    incomplete?: boolean;
  };

  let {
    lang = "",
    text = "",
    domain,
    renderMode = "component",
    runtimeHost,
    useGlobalRuntimeHost = false,
    securePolicy = {},
    hostAdapter,
    secureFrame,
    playgroundUrl = "/playground.html",
    className = "",
    incomplete = false,
  }: Props = $props();

  const blockId = createBlockId();
  let localRuntimeHost = $state<SlexKitUpdatableMarkdownRuntimeHost>();
  let runtimeApi = $state<RuntimeModule | null>(null);
  let runtimeLoadError = $state<unknown>(null);
  let runtimeError = $state<unknown>(null);
  let loadToken = 0;
  let previewMode = $state<PreviewMode>("preview");
  let copied = $state(false);
  let copiedTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => {
    if (copiedTimer) clearTimeout(copiedTimer);
    localRuntimeHost?.disposeAll();
  });

  const info = $derived(parseCodeInfo(lang));
  const isSlex = $derived(info.language === "slex");
  const activeHost = $derived(
    (runtimeHost
      ?? (useGlobalRuntimeHost && runtimeApi
        ? runtimeApi.getSlexKitMarkdownRuntimeHost()
        : localRuntimeHost)) as SlexKitUpdatableMarkdownRuntimeHost | undefined,
  );
  const inspection = $derived(isSlex && runtimeApi ? runtimeApi.inspectSlexSource(text) : null);
  const phase = $derived(incomplete || !inspection?.ok ? "preview" as const : "commit" as const);
  const displayError = $derived(incomplete ? null : (inspection && !inspection.ok ? inspection.error : runtimeError ?? runtimeLoadError));
  const artifactId = $derived(domain || "site-markdown");
  const effectiveRenderMode = $derived(resolveRenderMode(info.meta, renderMode));
  const blockClass = $derived([className, `slex-doc-slexkit-demo--${effectiveRenderMode}`].filter(Boolean).join(" "));

  $effect(() => {
    if (!isSlex) return;
    const token = ++loadToken;
    runtimeLoadError = null;
    loadSlexKitRuntime()
      .then((api) => {
        if (token !== loadToken) return;
        runtimeApi = api as RuntimeModule;
        localRuntimeHost ??= api.createSlexKitMarkdownRuntimeHost({
          policy: securePolicy,
          hostAdapter,
          secureFrame: normalizedSecureFrame(),
        });
      })
      .catch((error) => {
        if (token === loadToken) runtimeLoadError = error;
      });
  });

  function normalizedSecureFrame(): SecureFrameOptions {
    if (secureFrame && typeof secureFrame === "object") {
      return { ...secureFrame, runtimeUrl: secureFrame.runtimeUrl || resolveSlexKitSandboxRuntimeUrl() };
    }
    const runtimeUrl = resolveSlexKitSandboxRuntimeUrl();
    return { runtimeUrl, fontUrls: [new URL("./fonts/", runtimeUrl).href] };
  }

  function coordinatePreview(node: HTMLElement) {
    const owner = {};
    let registeredHost: SlexKitUpdatableMarkdownRuntimeHost | undefined;
    let registeredArtifact = "";
    let updateToken = 0;

    const update = () => {
      const token = ++updateToken;
      runtimeError = null;
      if (registeredHost && (registeredHost !== activeHost || registeredArtifact !== artifactId)) {
        removeSlexArtifactRegistration(registeredHost, registeredArtifact, owner);
        registeredHost = undefined;
      }
      if (!activeHost) return;

      activeHost.configure({ policy: securePolicy, hostAdapter, secureFrame: normalizedSecureFrame() });
      const block: SlexKitMarkdownBlock = {
        artifactId,
        blockId,
        source: text,
        container: node,
        dir: document.documentElement.dir || "auto",
      };
      registeredHost = activeHost;
      registeredArtifact = artifactId;
      updateSlexArtifactRegistration(activeHost, artifactId, owner, [block], phase, (error) => {
        if (token === updateToken) runtimeError = error;
      });
    };

    update();
    return {
      update,
      destroy() {
        updateToken += 1;
        if (registeredHost) removeSlexArtifactRegistration(registeredHost, registeredArtifact, owner);
        node.replaceChildren();
      },
    };
  }

  function parseCodeInfo(value = "") {
    const [language = "", ...meta] = String(value).trim().split(/\s+/);
    return { language: language.toLowerCase(), meta: meta.join(" ") };
  }

  function parseFenceOptions(meta = ""): FenceOptions {
    const options: FenceOptions = {};
    for (const match of meta.matchAll(/([A-Za-z0-9_-]+)=("([^"]*)"|'([^']*)'|([^\s]+))/g)) {
      options[match[1]] = match[3] ?? match[4] ?? match[5] ?? "";
    }
    return options;
  }

  function resolveRenderMode(meta: string, fallback: RenderMode): RenderMode {
    const value = String(parseFenceOptions(meta).render ?? parseFenceOptions(meta).mode ?? "").toLowerCase();
    return value === "playground" || value === "editor" || value === "live" ? "playground" : fallback;
  }

  function playgroundHref(mode: "render" | "live" | "code" = "live") {
    const url = new URL(playgroundUrl, window.location.href);
    setPlaygroundSource(url, text);
    url.searchParams.set("type", "slex");
    url.searchParams.set("mode", mode);
    url.searchParams.set("embed", "1");
    return url.href;
  }

  function labels() {
    const zh = document.documentElement.lang.toLowerCase().startsWith("zh");
    return zh ? {
      toolbar: "示例预览控制",
      preview: "预览",
      live: "实时编辑与预览",
      code: "查看 HTML 源码",
      copy: copied ? "已复制" : "复制源码",
      popout: "在新窗口打开",
    } : {
      toolbar: "Example preview controls",
      preview: "Preview",
      live: "Live editor and preview",
      code: "View HTML source",
      copy: copied ? "Copied" : "Copy source",
      popout: "Open in new window",
    };
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    copied = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => copied = false, 1200);
  }

  function openPopout() {
    window.open(playgroundHref(previewMode === "code" ? "code" : previewMode === "preview" ? "render" : "live"), "_blank", "noopener,noreferrer");
  }

  function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error ?? "Unknown SlexKit error");
  }
</script>

{#if !isSlex}
  <HighlightedMarkdownCode {lang} {text} />
{:else if !runtimeApi && !runtimeLoadError}
  <div class={`slex-streamdown-block ${blockClass}`.trim()}><div class="slex-streamdown-loading">Loading SlexKit runtime...</div></div>
{:else if effectiveRenderMode === "playground"}
  <iframe class={`slex-example-live-frame ${blockClass}`.trim()} title="SlexKit HTML playground" src={playgroundHref()}></iframe>
{:else}
  {@const ui = labels()}
  <div class={`slex-example-shell ${blockClass}`.trim()} data-preview-mode={previewMode}>
    <div class="slex-preview-toolbar" role="toolbar" aria-label={ui.toolbar}>
      <div class="slex-preview-modes">
        <button type="button" class:is-active={previewMode === "preview"} aria-pressed={previewMode === "preview"} aria-label={ui.preview} title={ui.preview} onclick={() => previewMode = "preview"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>
        </button>
        <button type="button" class:is-active={previewMode === "live"} aria-pressed={previewMode === "live"} aria-label={ui.live} title={ui.live} onclick={() => previewMode = "live"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 5v14"/></svg>
        </button>
        <button type="button" class:is-active={previewMode === "code"} aria-pressed={previewMode === "code"} aria-label={ui.code} title={ui.code} onclick={() => previewMode = "code"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></svg>
        </button>
      </div>
      <span class="slex-preview-format">HTML</span>
      <div class="slex-preview-actions">
        <button type="button" aria-label={ui.popout} title={ui.popout} onclick={openPopout}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>
        </button>
        <button type="button" data-copied={copied} aria-label={ui.copy} title={ui.copy} onclick={copySource}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
        </button>
      </div>
    </div>

    <div class="slex-preview-canvas slex-component-preview" hidden={previewMode !== "preview"}>
      <div class="slex-component-preview-inner">
        {#if displayError}
          <div class="slex-streamdown-error" role="alert">
            <div class="slex-streamdown-error-title">SlexKit HTML validation failed</div>
            <div class="slex-streamdown-error-message">{errorMessage(displayError)}</div>
          </div>
        {/if}
        <div use:coordinatePreview={{ activeHost, artifactId, text, phase }}></div>
      </div>
    </div>
    {#if previewMode === "live"}
      <iframe class="slex-component-live-frame" title={ui.live} src={playgroundHref("live")}></iframe>
    {/if}
    <div class="slex-component-code" hidden={previewMode !== "code"}>
      <HighlightedMarkdownCode lang="html" {text} />
    </div>
  </div>
{/if}
