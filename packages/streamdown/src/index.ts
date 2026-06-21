import {
  createElement,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CodeBlockContainer,
  CodeBlockHeader,
  type CustomRenderer,
  type CustomRendererProps,
} from "streamdown";
import {
  ingest,
  createSlexKitMarkdownRuntimeHost,
  disposeNamespace,
  getSlexKitMarkdownRuntimeHost,
  mount,
  mountSecureArtifact,
  parseSlexSource,
  parseSlexStreamingSource,
  type SlexKitMarkdownRuntimeHost,
  type HostRuntimeAdapter,
  type HostRuntimePolicy,
  type SecureFrameOptions,
  type SlexStreamingMode,
} from "slexkit";

const DEFAULT_LANGUAGES = ["slex"] as const;
const STREAMDOWN_RENDERER_VERSION = "0.3.3";
const DEFAULT_SECURE_POLICY: HostRuntimePolicy = {};
let nextPreviewId = 0;

export type SlexKitRendererOptions = {
  languages?: string | string[];
  domain?: string;
  renderMode?: "component" | "playground";
  runtime?: "trusted" | "secure";
  runtimeHost?: SlexKitMarkdownRuntimeHost;
  useGlobalRuntimeHost?: boolean;
  securePolicy?: HostRuntimePolicy;
  hostAdapter?: HostRuntimeAdapter;
  secureFrame?: boolean | SecureFrameOptions;
  playgroundUrl?: string;
  showChrome?: boolean;
  showSource?: boolean;
  streaming?: SlexStreamingMode | true;
  placeholder?: ReactNode;
  className?: string;
  onError?: (error: unknown, code: string) => void;
};

export type SlexKitRendererProps = CustomRendererProps &
  Omit<SlexKitRendererOptions, "languages">;

type SlexKitInput = Parameters<typeof mount>[0];
type SlexKitDiagnostic = {
  message: string;
  line: number;
  column: number;
  detail?: string;
  excerpt: string;
};

type FenceOptions = Record<string, string>;
type SlexKitRendererCoordinatorBlock = {
  code: string;
  container: HTMLElement;
  isStateOnly: boolean;
  runtimeInput: SlexKitInput;
  setError: (error: unknown) => void;
  onError?: (error: unknown, code: string) => void;
};

type SlexKitRendererCoordinator = {
  artifactId: string;
  runtimeHost: SlexKitMarkdownRuntimeHost;
  blocks: Map<symbol, SlexKitRendererCoordinatorBlock>;
  scheduled: boolean;
};

function languageList(languages: string | string[] | undefined): string | string[] {
  return languages ?? [...DEFAULT_LANGUAGES];
}

function normalizeStreamingMode(mode: SlexStreamingMode | true | undefined): SlexStreamingMode {
  if (mode === undefined || mode === true) return "repair";
  return mode;
}

function createPreviewDomainId(): string {
  nextPreviewId += 1;
  return `slexkit_preview_${nextPreviewId.toString(36)}`;
}

function parseFinalSlexSource(source: string) {
  const parsed = parseSlexSource(source);
  return parsed.ok
    ? { status: "complete" as const, source, value: parsed.value }
    : {
        status: "invalid" as const,
        source,
        error: parsed.error,
        diagnostic: parsed.diagnostic,
      };
}

async function copySource(code: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(code);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = code;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function defaultPlaceholder(): ReactNode {
  return createElement(
    "div",
    { className: "slex-streamdown-placeholder" },
    "Rendering SlexKit...",
  );
}

function parseFenceOptions(meta = ""): FenceOptions {
  const options: FenceOptions = {};
  for (const match of String(meta).matchAll(/([A-Za-z0-9_-]+)=("([^"]*)"|'([^']*)'|([^\s]+))/g)) {
    options[match[1]] = match[3] ?? match[4] ?? match[5] ?? "";
  }
  return options;
}

function resolveRenderMode(meta: string | undefined, fallback: "component" | "playground"): "component" | "playground" {
  const options = parseFenceOptions(meta);
  const value = String(options.render ?? options.as ?? options.mode ?? "").toLowerCase();
  if (value === "playground" || value === "editor" || value === "workbench") return "playground";
  if (value === "component" || value === "render" || value === "preview") return "component";
  return fallback;
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

function renderError(error: unknown): ReactNode {
  const diagnostic = errorDiagnostic(error);
  if (!diagnostic) {
    return createElement(
      "div",
      { className: "slex-streamdown-error", role: "alert" },
      createElement("div", { className: "slex-streamdown-error-title" }, "Failed to render SlexKit"),
      createElement("div", { className: "slex-streamdown-error-message" }, errorMessage(error)),
    );
  }

  return createElement(
    "div",
    { className: "slex-streamdown-error", role: "alert" },
    createElement("div", { className: "slex-streamdown-error-title" }, "SlexKit syntax error"),
    createElement("div", { className: "slex-streamdown-error-message" }, diagnostic.message),
    createElement(
      "div",
      { className: "slex-streamdown-error-location" },
      `Line ${diagnostic.line}, column ${diagnostic.column}`,
    ),
    diagnostic.detail
      ? createElement("div", { className: "slex-streamdown-error-detail" }, diagnostic.detail)
      : null,
    createElement("pre", { className: "slex-streamdown-error-excerpt" }, diagnostic.excerpt),
  );
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

function scopedSlexKitInput(code: string, source: unknown, domain: string | undefined): SlexKitInput {
  if (!domain || !isRecord(source)) return code;

  if (!("slex" in source || "namespace" in source || "g" in source || "layout" in source)) {
    if (!isRenderableSource(source)) return code;
    return {
      namespace: `${domain}::default`,
      g: {},
      layout: source,
    } as unknown as SlexKitInput;
  }

  const namespace = String(source.namespace || "default");
  if (!("layout" in source) && isRenderableSource(source)) {
    const { slex, namespace: _namespace, g, layout: _layout, ...bareLayout } = source;
    return {
      ...(typeof slex === "string" ? { slex } : {}),
      namespace: `${domain}::${namespace}`,
      ...(isRecord(g) ? { g } : {}),
      layout: bareLayout,
    } as unknown as SlexKitInput;
  }

  return {
    ...source,
    namespace: `${domain}::${namespace}`,
  } as unknown as SlexKitInput;
}

function scopedNamespace(source: unknown, domain: string | undefined): string | undefined {
  if (!domain || !isRecord(source)) return undefined;
  if (!("slex" in source || "namespace" in source || "g" in source || "layout" in source)) {
    return isRenderableSource(source) ? `${domain}::default` : undefined;
  }
  return `${domain}::${String(source.namespace || "default")}`;
}

function playgroundOption(meta: string | undefined, key: string, fallback = ""): string {
  return parseFenceOptions(meta)[key] || fallback;
}

function compareContainerOrder(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

function scheduleCoordinatorRender(coordinator: SlexKitRendererCoordinator): void {
  if (coordinator.scheduled) return;
  coordinator.scheduled = true;
  queueMicrotask(() => {
    coordinator.scheduled = false;
    coordinator.runtimeHost.disposeArtifact(coordinator.artifactId);

    const blocks = Array.from(coordinator.blocks.values())
      .sort((a, b) => compareContainerOrder(a.container, b.container));
    for (const block of blocks) {
      block.container.replaceChildren();
      block.setError(null);
      try {
        coordinator.runtimeHost.mountBlock({
          artifactId: coordinator.artifactId,
          source: block.runtimeInput,
          container: block.container,
        });
        if (!block.isStateOnly && !block.container.querySelector(".slexkit-root")) {
          throw new Error("SlexKit did not render a root. Check the source syntax.");
        }
      } catch (err) {
        block.container.replaceChildren();
        block.setError(err);
        block.onError?.(err, block.code);
      }
    }
  });
}

function playgroundSlexKitInput(
  code: string,
  meta: string | undefined,
  domain: string | undefined,
  playgroundUrl: string | undefined,
): SlexKitInput {
  const options = parseFenceOptions(meta);
  const namespace = domain || "streamdown";
  return {
    slex: "0.1",
    namespace: `${namespace}::playground`,
    g: {},
    layout: {
      "playground:inline": {
        domain: `${namespace}::playground`,
        mode: options.mode || options.webMode || "render",
        playgroundUrl: options.webUrl || options.playgroundUrl || playgroundUrl || "/playground.html",
        pluginVersion: options.pluginVersion || STREAMDOWN_RENDERER_VERSION,
        previewMinHeight: playgroundOption(meta, "previewMinHeight", playgroundOption(meta, "height", "360px")),
        source: code,
        sourceType: "slex",
        title: playgroundOption(meta, "title", "SlexKit playground"),
      },
    },
  };
}

function PlaygroundShell({
  code,
  domain,
  meta,
  playgroundUrl,
}: {
  code: string;
  domain?: string;
  meta?: string;
  playgroundUrl?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();
    setLoadError(null);

    let active = true;
    let cleanup: (() => void) | undefined;

    void import("slexkit/tooling")
      .then(() => {
        if (!active) return;
        cleanup = mount(playgroundSlexKitInput(code, meta, domain, playgroundUrl), host);
      })
      .catch((err) => {
        if (active) setLoadError(err);
      });

    return () => {
      active = false;
      cleanup?.();
      host.replaceChildren();
    };
  }, [code, domain, meta, playgroundUrl]);

  return createElement(
    Fragment,
    null,
    loadError ? renderError(loadError) : null,
    createElement("div", { ref: hostRef }),
  );
}

type SlexKitRendererInternalProps = SlexKitRendererProps & {
  coordinator?: SlexKitRendererCoordinator;
};

function renderSlexKitRenderer({
  code,
  language,
  isIncomplete,
  meta,
  domain,
  renderMode = "component",
  runtime = "trusted",
  runtimeHost,
  useGlobalRuntimeHost = false,
  securePolicy = DEFAULT_SECURE_POLICY,
  hostAdapter,
  secureFrame = true,
  playgroundUrl,
  showChrome = true,
  showSource = false,
  streaming,
  placeholder,
  className,
  onError,
  coordinator,
}: SlexKitRendererInternalProps) {
  const hostRef = useRef<HTMLElement>(null);
  const blockIdRef = useRef<symbol>(Symbol("slexkit-streamdown-block"));
  const previewIdRef = useRef<string | null>(null);
  previewIdRef.current ??= createPreviewDomainId();
  const [error, setError] = useState<unknown>(null);
  const isSecureRuntime = runtime === "secure";
  const activeRuntimeHost = coordinator?.runtimeHost ?? runtimeHost ?? (useGlobalRuntimeHost ? getSlexKitMarkdownRuntimeHost() : undefined);
  const activeRuntimeMode = activeRuntimeHost?.getMode();
  const delegatesToSecureHost = activeRuntimeMode === "secure";
  const streamingMode = normalizeStreamingMode(streaming);
  const streamingResult = useMemo(
    () => {
      if ((streamingMode === false && isIncomplete) || isSecureRuntime || delegatesToSecureHost) return undefined;
      return isIncomplete
        ? parseSlexStreamingSource(code, { mode: streamingMode })
        : parseFinalSlexSource(code);
    },
    [code, delegatesToSecureHost, isIncomplete, isSecureRuntime, streamingMode],
  );
  const isPreviewSource = streamingResult?.status === "repaired";
  const parseError = streamingResult?.status === "invalid" ? streamingResult.error : null;
  const isPendingSource = Boolean(isIncomplete && (
    streamingMode === false
    || isSecureRuntime
    || delegatesToSecureHost
    || streamingResult?.status === "pending"
  ));
  const parsedValue = streamingResult?.status === "complete" || streamingResult?.status === "repaired"
    ? streamingResult.value
    : undefined;
  const previewDomain = `${domain ? `${domain}::` : ""}${previewIdRef.current}`;
  const runtimeDomain = isPreviewSource ? previewDomain : domain;
  const sourceKind = useMemo(() => {
    if (isPendingSource) return "renderable";
    if (isSecureRuntime || delegatesToSecureHost) return "renderable";
    return parsedValue && isStateOnlySource(parsedValue) ? "state-only" : "renderable";
  }, [delegatesToSecureHost, isPendingSource, isSecureRuntime, parsedValue]);
  const isStateOnly = sourceKind === "state-only";
  const runtimeInput = useMemo(
    () => {
      if (isSecureRuntime) return String(code);
      if (activeRuntimeHost) return isPreviewSource && streamingResult?.status === "repaired" ? streamingResult.repairedSource : String(code);
      return scopedSlexKitInput(String(code), parsedValue, runtimeDomain);
    },
    [code, activeRuntimeHost, isPreviewSource, isSecureRuntime, parsedValue, runtimeDomain, streamingResult],
  );
  const previewNamespace = isPreviewSource ? scopedNamespace(parsedValue, runtimeDomain) : undefined;
  const effectiveRenderMode = useMemo(
    () => resolveRenderMode(meta, renderMode),
    [meta, renderMode],
  );
  const displayError = isPendingSource ? null : (parseError ?? error);

  useEffect(() => {
    setError(null);

    if (isPendingSource) return;
    if (parseError) {
      onError?.(parseError, String(code));
      return;
    }
    if (coordinator && !isPreviewSource && effectiveRenderMode !== "playground") {
      const host = hostRef.current;
      if (!host) return;
      coordinator.blocks.set(blockIdRef.current, {
        code: String(code),
        container: host,
        isStateOnly,
        runtimeInput,
        setError,
        onError,
      });
      scheduleCoordinatorRender(coordinator);
      return () => {
        coordinator.blocks.delete(blockIdRef.current);
        scheduleCoordinatorRender(coordinator);
      };
    }
    if (isStateOnly) {
      if (activeRuntimeHost) {
        const container = document.createElement("span");
        try {
          const cleanup = activeRuntimeHost.mountBlock({
            artifactId: runtimeDomain,
            executionMode: isPreviewSource ? "preview" : "live",
            source: runtimeInput,
            container,
          });
          return () => {
            cleanup();
            if (isPreviewSource && runtimeDomain) activeRuntimeHost.disposeArtifact(runtimeDomain);
          };
        } catch (err) {
          setError(err);
          onError?.(err, String(code));
          return;
        }
      }
      if (!ingest(runtimeInput)) {
        const err = new Error("Failed to parse Slex state block.");
        setError(err);
        onError?.(err, String(code));
      }
      if (isPreviewSource && previewNamespace) return () => disposeNamespace(previewNamespace);
      return;
    }
    if (effectiveRenderMode === "playground") return;

    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();

    let cleanup: (() => void) | undefined;
    try {
      cleanup = activeRuntimeHost
        ? activeRuntimeHost.mountBlock({
            artifactId: runtimeDomain,
            executionMode: isPreviewSource ? "preview" : "live",
            source: runtimeInput,
            container: host,
            theme: undefined,
          })
        : isSecureRuntime
        ? mountSecureArtifact(runtimeInput, host, {
            policy: securePolicy,
            hostAdapter,
            frame: secureFrame,
          })
        : mount(runtimeInput, host, { executionMode: isPreviewSource ? "preview" : "live" });
      if (!host.querySelector(".slexkit-root")) {
        if (delegatesToSecureHost) return;
        if (isSecureRuntime && host.querySelector("iframe[data-slexkit-secure-frame='true']")) return;
        throw new Error("SlexKit did not render a root. Check the source syntax.");
      }
    } catch (err) {
      try {
        cleanup?.();
      } finally {
        host.replaceChildren();
      }
      setError(err);
      onError?.(err, String(code));
    }

    return () => {
      cleanup?.();
      if (isPreviewSource) {
        if (activeRuntimeHost && runtimeDomain) activeRuntimeHost.disposeArtifact(runtimeDomain);
        if (previewNamespace) disposeNamespace(previewNamespace);
      }
      host.replaceChildren();
    };
  }, [
    code,
    activeRuntimeHost,
    delegatesToSecureHost,
    domain,
    effectiveRenderMode,
    hostAdapter,
    isPendingSource,
    isPreviewSource,
    isSecureRuntime,
    isStateOnly,
    onError,
    parseError,
    previewNamespace,
    runtimeInput,
    runtimeDomain,
    secureFrame,
    securePolicy,
  ]);

  if (isStateOnly) {
    return coordinator ? createElement("span", { ref: hostRef, hidden: true }) : null;
  }

  const body = createElement(
    "div",
    { className: "slex-streamdown-body" },
    isPendingSource ? (placeholder ?? defaultPlaceholder()) : null,
    !isPendingSource && effectiveRenderMode === "playground"
      ? createElement(PlaygroundShell, {
          code: String(code),
          domain,
          meta,
          playgroundUrl,
        })
      : createElement(
          Fragment,
          null,
          displayError ? renderError(displayError) : null,
          createElement("div", { ref: hostRef }),
        ),
  );

  if (!showChrome) {
    return createElement(
      "div",
      {
        className: ["slex-streamdown-block", className].filter(Boolean).join(" "),
      },
      body,
      showSource
        ? createElement(
            "details",
            { className: "slex-streamdown-source" },
            createElement("summary", null, "Source"),
            createElement(
              "pre",
              null,
              createElement("code", null, code),
            ),
          )
        : null,
    );
  }

  return createElement(
    CodeBlockContainer,
    {
      className: ["slex-streamdown-block", className].filter(Boolean).join(" "),
      isIncomplete,
      language,
    },
    createElement(CodeBlockHeader, { language }),
    createElement(
      "div",
      { className: "slex-streamdown-toolbar" },
      createElement(
        "button",
        {
          className: "slex-streamdown-copy",
          onClick: () => {
            void copySource(code);
          },
          type: "button",
        },
        "Copy source",
      ),
    ),
    body,
    showSource
      ? createElement(
          "details",
          { className: "slex-streamdown-source" },
          createElement("summary", null, "Source"),
          createElement(
            "pre",
            null,
            createElement("code", null, code),
          ),
        )
      : null,
  );
}

export function SlexKitRenderer(props: SlexKitRendererProps): ReactNode {
  return renderSlexKitRenderer(props);
}

function SlexKitRendererWithCoordinator(props: SlexKitRendererInternalProps): ReactNode {
  return renderSlexKitRenderer(props);
}

export function createSlexKitRenderer(
  options: SlexKitRendererOptions = {},
): CustomRenderer {
  const { languages, ...rendererOptions } = options;
  const coordinator = rendererOptions.domain && rendererOptions.runtime !== "secure"
    ? {
        artifactId: rendererOptions.domain,
        runtimeHost: rendererOptions.runtimeHost ?? createSlexKitMarkdownRuntimeHost(),
        blocks: new Map<symbol, SlexKitRendererCoordinatorBlock>(),
        scheduled: false,
      } satisfies SlexKitRendererCoordinator
    : undefined;
  return {
    language: languageList(languages),
    component: (props) =>
      createElement(SlexKitRendererWithCoordinator, { ...props, ...rendererOptions, coordinator }),
  };
}

export const slexkitRenderer = createSlexKitRenderer();
