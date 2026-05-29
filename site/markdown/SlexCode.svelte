<script lang="ts">
  import { loadSlexKitRuntime, loadSlexKitTooling } from "./runtime-loader.js";
  import HighlightedMarkdownCode from "./HighlightedMarkdownCode.svelte";
  import type {
    SlexKitMarkdownRuntimeHost,
    HostRuntimeAdapter,
    HostRuntimePolicy,
    SecureFrameOptions,
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
  }: Props = $props();

  let runtimeApi = $state<SlexKitRuntimeModule | null>(null);
  let runtimeError = $state<unknown>(null);
  let runtimeLoadError = $state<unknown>(null);
  let runtimeLoadToken = 0;

  const info = $derived(parseCodeInfo(lang));
  const isSlexKit = $derived(info.language === "slex");
  const activeRuntimeHost = $derived(runtimeHost ?? (useGlobalRuntimeHost && runtimeApi ? runtimeApi.getSlexKitMarkdownRuntimeHost() : undefined));
  const activeRuntimeMode = $derived(activeRuntimeHost?.getMode());
  const isSecureRuntime = $derived(runtime === "secure");
  const delegatesToSecureHost = $derived(activeRuntimeMode === "secure");
  const parsedSource = $derived(isSlexKit && runtimeApi && !isSecureRuntime && !delegatesToSecureHost ? runtimeApi.parseSlexSource(text) : null);
  const sourceKind = $derived(parsedSource?.ok && isStateOnlySource(parsedSource.value) ? "state-only" : "renderable");
  const runtimeInput = $derived(isSecureRuntime || delegatesToSecureHost ? text : scopedSlexKitInput(text, parsedSource?.ok ? parsedSource.value : undefined, domain));
  const effectiveRenderMode = $derived(resolveRenderMode(info.meta, renderMode));
  const parseError = $derived(parsedSource && !parsedSource.ok ? parsedSource.error : null);
  const displayError = $derived(parseError ?? runtimeError ?? runtimeLoadError);
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
    if (!runtimeApi || !isSlexKit || isSecureRuntime || delegatesToSecureHost || sourceKind !== "state-only") return;
    if (!runtimeApi.ingest(runtimeInput)) {
      runtimeError = new Error("Failed to parse Slex state block.");
    }
  });

  function renderPreview(node: HTMLElement) {
    let cleanup: (() => void) | undefined;

    const render = () => {
      cleanup?.();
      node.replaceChildren();
      runtimeError = null;

      if (displayError || !runtimeApi || !isSlexKit || sourceKind === "state-only") return;

      try {
        cleanup = activeRuntimeHost
          ? activeRuntimeHost.mountBlock({
              artifactId: domain,
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
          : runtimeApi.mount(runtimeInput, node, runtimeMountOptions());
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
    if (!scope || !isRecord(source) || !("slex" in source || "namespace" in source || "g" in source || "layout" in source)) return code;

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
</script>

{#if !isSlexKit}
  <HighlightedMarkdownCode {lang} {text} />
{:else if !runtimeApi && !runtimeLoadError}
  <div class={`slex-streamdown-block ${blockClass}`.trim()}>
    <div class="slex-streamdown-body">
      <div class="slex-streamdown-loading">Loading SlexKit runtime...</div>
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
