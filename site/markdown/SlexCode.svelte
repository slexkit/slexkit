<script module lang="ts">
  let nextPreviewId = 0;

  function createPreviewDomainId(): string {
    nextPreviewId += 1;
    return `slexkit_preview_${nextPreviewId.toString(36)}`;
  }
</script>

<script lang="ts">
  import { loadSlexKitRuntime, loadSlexKitTooling } from "./runtime-loader.js";
  import HighlightedMarkdownCode from "./HighlightedMarkdownCode.svelte";
  import type {
    SlexKitMarkdownRuntimeHost,
    HostRuntimeAdapter,
    HostRuntimePolicy,
    SecureFrameOptions,
    SlexStreamingMode,
  } from "slexkit";
  import type * as SlexKitRuntime from "slexkit";

  type RenderMode = "component" | "playground";
  type RuntimeMode = "trusted" | "secure";
  type FenceOptions = Record<string, string>;
  type SlexKitRuntimeModule = typeof SlexKitRuntime;
  type SlexKitInput = Parameters<SlexKitRuntimeModule["mount"]>[0];

  type SlexKitDiagnostic = {
    message: string;
    line: number;
    column: number;
    detail?: string;
    excerpt: string;
  };

  type Props = {
    lang?: string;
    text?: string;
    domain?: string;
    renderMode?: RenderMode;
    runtime?: RuntimeMode;
    runtimeHost?: SlexKitMarkdownRuntimeHost;
    useGlobalRuntimeHost?: boolean;
    securePolicy?: HostRuntimePolicy;
    hostAdapter?: HostRuntimeAdapter;
    secureFrame?: boolean | SecureFrameOptions;
    playgroundUrl?: string;
    className?: string;
    streaming?: SlexStreamingMode | true;
    incomplete?: boolean;
  };

  let {
    lang = "",
    text = "",
    domain,
    renderMode = "component",
    runtime = "trusted",
    runtimeHost,
    useGlobalRuntimeHost = false,
    securePolicy = {},
    hostAdapter,
    secureFrame = true,
    playgroundUrl = "/playground.html",
    className = "",
    streaming = false,
    incomplete = false,
  }: Props = $props();

  let runtimeApi = $state<SlexKitRuntimeModule | null>(null);
  let runtimeError = $state<unknown>(null);
  let runtimeLoadError = $state<unknown>(null);
  let runtimeLoadToken = 0;
  const previewId = createPreviewDomainId();

  const info = $derived(parseCodeInfo(lang));
  const isSlexKit = $derived(info.language === "slex");
  const activeRuntimeHost = $derived(runtimeHost ?? (useGlobalRuntimeHost && runtimeApi ? runtimeApi.getSlexKitMarkdownRuntimeHost() : undefined));
  const activeRuntimeMode = $derived(activeRuntimeHost?.getMode());
  const isSecureRuntime = $derived(runtime === "secure");
  const usesRuntimeHost = $derived(!!activeRuntimeHost);
  const delegatesToSecureHost = $derived(activeRuntimeMode === "secure");
  const streamingMode = $derived(normalizeStreamingMode(streaming));
  const streamingResult = $derived(isSlexKit && runtimeApi && !isSecureRuntime && !delegatesToSecureHost && streamingMode !== false
    ? incomplete
      ? runtimeApi.parseSlexStreamingSource(text, { mode: streamingMode })
      : parseFinalSlexSource(runtimeApi, text)
    : null);
  const sourcePending = $derived(Boolean(
    isSlexKit
      && runtimeApi
      && (
        (incomplete && streamingMode === false)
        || (incomplete && streamingMode !== false && (isSecureRuntime || delegatesToSecureHost))
        || (incomplete && streamingMode !== false && streamingResult?.status === "pending")
      ),
  ));
  const parsedSource = $derived(isSlexKit && runtimeApi && !sourcePending && !isSecureRuntime && !delegatesToSecureHost && streamingMode === false ? runtimeApi.parseSlexSource(text) : null);
  const isPreviewSource = $derived(streamingResult?.status === "repaired");
  const parsedValue = $derived(streamingResult?.status === "complete" || streamingResult?.status === "repaired"
    ? streamingResult.value
    : parsedSource?.ok
      ? parsedSource.value
      : undefined);
  const previewDomain = $derived(`${domain ? `${domain}::` : ""}${previewId}`);
  const runtimeDomain = $derived(isPreviewSource ? previewDomain : domain);
  const previewNamespace = $derived(isPreviewSource ? scopedNamespace(parsedValue, runtimeDomain) : undefined);
  const sourceKind = $derived(parsedValue && isStateOnlySource(parsedValue) ? "state-only" : "renderable");
  const runtimeInput = $derived(isSecureRuntime || usesRuntimeHost
    ? isPreviewSource && streamingResult?.status === "repaired" ? streamingResult.repairedSource : text
    : scopedSlexKitInput(text, parsedValue, runtimeDomain));
  const effectiveRenderMode = $derived(resolveRenderMode(info.meta, renderMode));
  const parseError = $derived(streamingResult?.status === "invalid" ? streamingResult.error : parsedSource && !parsedSource.ok ? parsedSource.error : null);
  const displayError = $derived(sourcePending ? null : (parseError ?? runtimeError ?? runtimeLoadError));
  const previewMinHeight = $derived(playgroundOption(info.meta, "previewMinHeight", playgroundOption(info.meta, "height", "360px")));
  const title = $derived(playgroundOption(info.meta, "title", "SlexKit playground"));
  const playgroundMode = $derived(playgroundOption(info.meta, "mode", playgroundOption(info.meta, "webMode", "render")));
  const blockClass = $derived([className, `slex-doc-slexkit-demo--${effectiveRenderMode}`].filter(Boolean).join(" "));
  const playgroundClass = $derived([className, "slex-doc-slexkit-demo--playground"].filter(Boolean).join(" "));
  function runtimeLabels() {
    const locale = document.documentElement.lang;
    if (locale === "en-US") {
      return {
        "button.label": "Button",
        "collapsible.trigger": "Expand",
        "select.placeholder": "Select",
        "submit.ignore": "Ignore",
        "submit.submit": "Submit",
        "toast.close": "Close notification",
      };
    }

    return {
      "button.label": "按钮",
      "collapsible.trigger": "展开",
      "select.placeholder": "请选择",
      "submit.ignore": "忽略",
      "submit.submit": "提交",
      "toast.close": "关闭通知",
    };
  }

  function runtimeMountOptions() {
    return {
      dir: document.documentElement.dir || "auto",
      labels: runtimeLabels(),
    } as const;
  }

  function configureRuntimeHost(): void {
    activeRuntimeHost?.configure({
      mode: runtime,
      policy: securePolicy,
      hostAdapter,
      secureFrame,
    });
  }

  $effect(() => {
    if (!isSlexKit) return;
    const token = ++runtimeLoadToken;
    runtimeLoadError = null;
    loadSlexKitRuntime()
      .then((api) => {
        if (token === runtimeLoadToken) runtimeApi = api as SlexKitRuntimeModule;
      })
      .catch((error) => {
        if (token === runtimeLoadToken) runtimeLoadError = error;
      });
  });

  $effect(() => {
    runtimeError = null;
    if (!runtimeApi || !isSlexKit || sourcePending || isSecureRuntime || delegatesToSecureHost || sourceKind !== "state-only") return;
    if (activeRuntimeHost) {
      const container = document.createElement("span");
      try {
        configureRuntimeHost();
        const cleanup = activeRuntimeHost.mountBlock({
          artifactId: runtimeDomain,
          executionMode: isPreviewSource ? "preview" : "live",
          source: runtimeInput,
          container,
          ...runtimeMountOptions(),
        });
        return () => {
          cleanup();
          if (isPreviewSource && runtimeDomain) activeRuntimeHost.disposeArtifact(runtimeDomain);
        };
      } catch (error) {
        runtimeError = error;
        return;
      }
    }
    if (!runtimeApi.ingest(runtimeInput)) {
      runtimeError = new Error("Failed to parse Slex state block.");
    }
    if (isPreviewSource && previewNamespace) return () => runtimeApi.disposeNamespace(previewNamespace);
  });

  function renderPreview(node: HTMLElement) {
    let cleanup: (() => void) | undefined;
    let mountedPreviewArtifactId: string | undefined;
    let mountedPreviewNamespace: string | undefined;

    const disposePreviewMount = () => {
      if (mountedPreviewArtifactId) activeRuntimeHost?.disposeArtifact(mountedPreviewArtifactId);
      if (mountedPreviewNamespace) runtimeApi?.disposeNamespace(mountedPreviewNamespace);
      mountedPreviewArtifactId = undefined;
      mountedPreviewNamespace = undefined;
    };

    const render = () => {
      cleanup?.();
      disposePreviewMount();
      node.replaceChildren();
      runtimeError = null;

      if (sourcePending || displayError || !runtimeApi || !isSlexKit || sourceKind === "state-only") return;

      try {
        if (activeRuntimeHost) configureRuntimeHost();
        cleanup = activeRuntimeHost
          ? activeRuntimeHost.mountBlock({
              artifactId: runtimeDomain,
              executionMode: isPreviewSource ? "preview" : "live",
              source: runtimeInput,
              container: node,
              ...runtimeMountOptions(),
            })
          : isSecureRuntime
          ? runtimeApi.mountSecureArtifact(runtimeInput, node, {
              ...runtimeMountOptions(),
              policy: securePolicy,
              hostAdapter,
              frame: secureFrame,
            })
          : runtimeApi.mount(runtimeInput, node, {
              ...runtimeMountOptions(),
              executionMode: isPreviewSource ? "preview" : "live",
            });
        if (isPreviewSource) {
          mountedPreviewArtifactId = activeRuntimeHost ? runtimeDomain : undefined;
          mountedPreviewNamespace = activeRuntimeHost ? undefined : previewNamespace;
        }
        if (!node.querySelector(".slexkit-root")) {
          if (delegatesToSecureHost) return;
          if (isSecureRuntime && node.querySelector("iframe[data-slexkit-secure-frame='true']")) return;
          throw new Error("SlexKit did not render a root. Check the Slex source syntax.");
        }
      } catch (error) {
        try {
          cleanup?.();
        } finally {
          node.replaceChildren();
        }
        runtimeError = error;
      }
    };

    render();
    return {
      update() {
        render();
      },
      destroy() {
        cleanup?.();
        disposePreviewMount();
        node.replaceChildren();
      },
    };
  }

  function renderPlayground(node: HTMLElement) {
    let cleanup: (() => void) | undefined;
    let active = true;

    const render = async () => {
      cleanup?.();
      node.replaceChildren();
      if (!runtimeApi) return;
      try {
        await loadSlexKitTooling();
      } catch (error) {
        runtimeError = error;
        return;
      }
      if (!active) return;
      cleanup = runtimeApi.mount({
        slex: "0.1",
        namespace: domain || "site_markdown_playground",
        g: {},
        layout: {
          "playground:inline": {
            class: playgroundClass,
            domain: domain || "site_markdown_playground",
            mode: playgroundMode,
            playgroundUrl,
            previewMinHeight,
            source: text,
            sourceType: "slex",
            title,
          },
        },
      }, node, runtimeMountOptions());
    };

    render();
    return {
      update() {
        void render();
      },
      destroy() {
        active = false;
        cleanup?.();
        node.replaceChildren();
      },
    };
  }

  function parseCodeInfo(value = "") {
    const raw = String(value ?? "").trim();
    const [language = "", ...metaParts] = raw.split(/\s+/);
    return {
      language: language.toLowerCase(),
      meta: metaParts.join(" "),
    };
  }

  function parseFenceOptions(meta = ""): FenceOptions {
    const options: FenceOptions = {};
    for (const match of String(meta).matchAll(/([A-Za-z0-9_-]+)=("([^"]*)"|'([^']*)'|([^\s]+))/g)) {
      options[match[1]] = match[3] ?? match[4] ?? match[5] ?? "";
    }
    return options;
  }

  function resolveRenderMode(meta: string | undefined, fallback: RenderMode): RenderMode {
    const options = parseFenceOptions(meta);
    const value = String(options.render ?? options.as ?? options.mode ?? "").toLowerCase();
    if (value === "playground" || value === "editor" || value === "workbench") return "playground";
    if (value === "component" || value === "render" || value === "preview") return "component";
    return fallback;
  }

  function playgroundOption(meta: string | undefined, key: string, fallback = "") {
    return parseFenceOptions(meta)[key] || fallback;
  }

  function normalizeStreamingMode(mode: SlexStreamingMode | true | undefined): SlexStreamingMode {
    if (mode === true) return "repair";
    if (mode === undefined) return false;
    return mode;
  }

  function parseFinalSlexSource(api: SlexKitRuntimeModule, source: string) {
    const parsed = api.parseSlexSource(source);
    return parsed.ok
      ? { status: "complete" as const, source, value: parsed.value }
      : {
          status: "invalid" as const,
          source,
          error: parsed.error,
          diagnostic: parsed.diagnostic,
        };
  }

  function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  function errorDiagnostic(error: unknown): SlexKitDiagnostic | null {
    if (!isRecord(error)) return null;
    const diagnostic = error.diagnostic;
    if (!isRecord(diagnostic)) return null;
    if (
      typeof diagnostic.message !== "string" ||
      typeof diagnostic.line !== "number" ||
      typeof diagnostic.column !== "number" ||
      typeof diagnostic.excerpt !== "string"
    ) {
      return null;
    }
    return {
      message: diagnostic.message,
      line: diagnostic.line,
      column: diagnostic.column,
      detail: typeof diagnostic.detail === "string" ? diagnostic.detail : undefined,
      excerpt: diagnostic.excerpt,
    };
  }

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

  function scopedSlexKitInput(code: string, source: unknown, scope: string | undefined): SlexKitInput {
    if (!scope || !isRecord(source)) return code;

    if (!("slex" in source || "namespace" in source || "g" in source || "layout" in source)) {
      if (!isRenderableSource(source)) return code;
      return {
        namespace: `${scope}::default`,
        g: {},
        layout: source,
      } as unknown as SlexKitInput;
    }

    const namespace = String(source.namespace || "default");
    if (!("layout" in source) && isRenderableSource(source)) {
      const { slex, namespace: _namespace, g, layout: _layout, ...bareLayout } = source;
      return {
        ...(typeof slex === "string" ? { slex } : {}),
        namespace: `${scope}::${namespace}`,
        ...(isRecord(g) ? { g } : {}),
        layout: bareLayout,
      } as unknown as SlexKitInput;
    }

    return {
      ...source,
      namespace: `${scope}::${namespace}`,
    } as unknown as SlexKitInput;
  }

  function scopedNamespace(source: unknown, scope: string | undefined): string | undefined {
    if (!scope || !isRecord(source)) return undefined;
    if (!("slex" in source || "namespace" in source || "g" in source || "layout" in source)) {
      return isRenderableSource(source) ? `${scope}::default` : undefined;
    }
    return `${scope}::${String(source.namespace || "default")}`;
  }
</script>

{#if !isSlexKit}
  <HighlightedMarkdownCode {lang} {text} />
{:else if !runtimeApi && !runtimeLoadError}
  <div class={`slex-streamdown-block ${blockClass}`.trim()}>
    <div class="slex-streamdown-body">
      <div class="slex-streamdown-loading">Loading SlexKit runtime...</div>
    </div>
  </div>
{:else if sourcePending}
  <div class={`slex-streamdown-block ${blockClass}`.trim()}>
    <div class="slex-streamdown-body">
      <div class="slex-streamdown-loading">Rendering SlexKit...</div>
    </div>
  </div>
{:else if sourceKind === "state-only"}
  {#if displayError}
    <div class="slex-streamdown-error" role="alert">
      <div class="slex-streamdown-error-title">Failed to render SlexKit</div>
      <div class="slex-streamdown-error-message">{errorMessage(displayError)}</div>
    </div>
  {/if}
{:else if effectiveRenderMode === "playground"}
  <div use:renderPlayground={text}></div>
{:else}
  <div class={`slex-streamdown-block ${blockClass}`.trim()}>
    <div class="slex-streamdown-body">
      {#if displayError}
        {@const diagnostic = errorDiagnostic(displayError)}
        <div class="slex-streamdown-error" role="alert">
          <div class="slex-streamdown-error-title">{diagnostic ? "SlexKit syntax error" : "Failed to render SlexKit"}</div>
          <div class="slex-streamdown-error-message">{diagnostic?.message ?? errorMessage(displayError)}</div>
          {#if diagnostic}
            <div class="slex-streamdown-error-location">Line {diagnostic.line}, column {diagnostic.column}</div>
            {#if diagnostic.detail}<div class="slex-streamdown-error-detail">{diagnostic.detail}</div>{/if}
            <pre class="slex-streamdown-error-excerpt">{diagnostic.excerpt}</pre>
          {/if}
        </div>
      {:else}
        <div use:renderPreview={runtimeInput}></div>
      {/if}
    </div>
  </div>
{/if}
