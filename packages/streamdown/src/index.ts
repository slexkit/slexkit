import {
  createElement,
  Fragment,
  useEffect,
  useId,
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
  createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHost,
  inspectSlexSource,
  type HostRuntimeAdapter,
  type HostRuntimePolicy,
  type HtmlSecureFrameOptions,
  type SlexKitMarkdownBlock,
  type SlexKitMarkdownRuntimeHost,
} from "slexkit";

const DEFAULT_LANGUAGES = ["slex"] as const;
let nextArtifactId = 0;
let nextBlockId = 0;

export type SlexKitRendererOptions = {
  languages?: string | string[];
  domain?: string;
  renderMode?: "component" | "playground";
  runtime?: "trusted" | "secure";
  runtimeHost?: SlexKitMarkdownRuntimeHost;
  useGlobalRuntimeHost?: boolean;
  securePolicy?: HostRuntimePolicy;
  hostAdapter?: HostRuntimeAdapter;
  secureFrame?: boolean | HtmlSecureFrameOptions;
  playgroundUrl?: string;
  showChrome?: boolean;
  showSource?: boolean;
  streaming?: "repair" | "stable" | false | true;
  placeholder?: ReactNode;
  className?: string;
  onError?: (error: unknown, code: string) => void;
};

export type SlexKitRendererProps = CustomRendererProps &
  Omit<SlexKitRendererOptions, "languages">;

type UpdatableHost = SlexKitMarkdownRuntimeHost & {
  updateArtifact(
    artifactId: string,
    blocks: readonly SlexKitMarkdownBlock[],
    options: { phase: "preview" | "commit"; reset?: boolean },
  ): Promise<void>;
  resetArtifact(artifactId: string): Promise<void>;
};

type BlockRecord = {
  blockId: string;
  code: string;
  container: HTMLElement;
  phase: "preview" | "commit";
  error: unknown;
  setError(error: unknown): void;
  onError?: (error: unknown, code: string) => void;
};

type Coordinator = {
  artifactId: string;
  host: SlexKitMarkdownRuntimeHost;
  blocks: Map<symbol, BlockRecord>;
  scheduled: boolean;
  pending: Promise<void>;
};

function isUpdatableHost(host: SlexKitMarkdownRuntimeHost): host is UpdatableHost {
  const candidate = host as Partial<UpdatableHost>;
  return typeof candidate.updateArtifact === "function"
    && typeof candidate.resetArtifact === "function";
}

function newArtifactId(prefix = "streamdown"): string {
  nextArtifactId += 1;
  return `${prefix}-${nextArtifactId.toString(36)}`;
}

function languageList(languages: string | string[] | undefined): string | string[] {
  return languages ?? [...DEFAULT_LANGUAGES];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function diagnosticFrom(result: ReturnType<typeof inspectSlexSource>): unknown {
  if (result.ok) return null;
  return result.error ?? result.diagnostic ?? new Error("Invalid SlexKit HTML source.");
}

function renderError(error: unknown): ReactNode {
  if (!error) return null;
  const diagnostic = typeof error === "object" && error !== null && "diagnostic" in error
    ? (error as { diagnostic?: { line?: number; column?: number; excerpt?: string } }).diagnostic
    : undefined;
  return createElement(
    "div",
    { className: "slex-streamdown-error", role: "alert" },
    createElement("div", { className: "slex-streamdown-error-title" }, "Failed to render SlexKit"),
    createElement("div", { className: "slex-streamdown-error-message" }, errorMessage(error)),
    diagnostic?.line && diagnostic?.column
      ? createElement("div", { className: "slex-streamdown-error-location" }, `Line ${diagnostic.line}, column ${diagnostic.column}`)
      : null,
    diagnostic?.excerpt
      ? createElement("pre", { className: "slex-streamdown-error-excerpt" }, diagnostic.excerpt)
      : null,
  );
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
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function compareContainers(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

function schedule(coordinator: Coordinator): void {
  if (coordinator.scheduled) return;
  coordinator.scheduled = true;
  queueMicrotask(() => {
    coordinator.scheduled = false;
    const records = [...coordinator.blocks.values()]
      .sort((left, right) => compareContainers(left.container, right.container));
    if (records.length === 0) {
      coordinator.host.disposeArtifact(coordinator.artifactId);
      return;
    }

    const phase = records.every((record) => record.phase === "commit" && !record.error)
      ? "commit"
      : "preview";
    const run = async () => {
      if (isUpdatableHost(coordinator.host)) {
        try {
          await coordinator.host.updateArtifact(
            coordinator.artifactId,
            records.map((record) => ({
              artifactId: coordinator.artifactId,
              blockId: record.blockId,
              source: record.code,
              container: record.container,
            })),
            { phase },
          );
          if (phase === "commit") records.forEach((record) => record.setError(null));
        } catch (error) {
          if (phase === "commit") {
            records.forEach((record) => {
              record.setError(error);
              record.onError?.(error, record.code);
            });
          }
        }
        return;
      }

      // Compatibility for custom hosts that predate atomic artifact updates.
      // Incomplete/invalid candidates never reach mountBlock.
      if (phase === "preview") return;
      const legacyHost = coordinator.host as unknown as Pick<
        SlexKitMarkdownRuntimeHost,
        "disposeBlock" | "mountBlock"
      >;
      for (const record of records) {
        try {
          legacyHost.disposeBlock(record.container);
          legacyHost.mountBlock({
            artifactId: coordinator.artifactId,
            blockId: record.blockId,
            source: record.code,
            container: record.container,
          });
          record.setError(null);
        } catch (error) {
          record.setError(error);
          record.onError?.(error, record.code);
        }
      }
    };
    coordinator.pending = coordinator.pending.then(run, run);
  });
}

function createHost(options: SlexKitRendererOptions): SlexKitMarkdownRuntimeHost {
  if (options.runtimeHost) return options.runtimeHost;
  if (options.useGlobalRuntimeHost) return getSlexKitMarkdownRuntimeHost();
  return createSlexKitMarkdownRuntimeHost({
    mode: options.runtime,
    policy: options.securePolicy,
    hostAdapter: options.hostAdapter,
    secureFrame: options.secureFrame,
  });
}

function useCoordinator(
  options: SlexKitRendererOptions,
  supplied: Coordinator | undefined,
): Coordinator {
  const reactId = useId().replace(/[^A-Za-z0-9_-]/g, "");
  return useMemo(() => supplied ?? ({
    artifactId: options.domain ?? newArtifactId(`streamdown-${reactId || "block"}`),
    host: createHost(options),
    blocks: new Map(),
    scheduled: false,
    pending: Promise.resolve(),
  }), []);
}

type InternalProps = SlexKitRendererProps & { coordinator?: Coordinator };

function Renderer(props: InternalProps): ReactNode {
  const {
    code,
    language,
    isIncomplete,
    coordinator: suppliedCoordinator,
    placeholder,
    showChrome = true,
    showSource = false,
    className,
    onError,
  } = props;
  const coordinator = useCoordinator(props, suppliedCoordinator);
  const hostRef = useRef<HTMLDivElement>(null);
  const registrationRef = useRef(Symbol("slexkit-streamdown-block"));
  const blockIdRef = useRef(`streamdown-block-${++nextBlockId}`);
  const [runtimeError, setRuntimeError] = useState<unknown>(null);
  const inspection = useMemo(
    () => isIncomplete ? undefined : inspectSlexSource(String(code)),
    [code, isIncomplete],
  );
  const sourceError = inspection ? diagnosticFrom(inspection) : null;

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;
    const record: BlockRecord = {
      blockId: blockIdRef.current,
      code: String(code),
      container,
      phase: isIncomplete || sourceError ? "preview" : "commit",
      error: sourceError,
      setError: setRuntimeError,
      onError,
    };
    coordinator.blocks.set(registrationRef.current, record);
    if (sourceError) onError?.(sourceError, String(code));
    schedule(coordinator);
    return () => {
      coordinator.blocks.delete(registrationRef.current);
      schedule(coordinator);
    };
  }, [coordinator]);

  useEffect(() => {
    const record = coordinator.blocks.get(registrationRef.current);
    if (!record) return;
    record.code = String(code);
    record.phase = isIncomplete || sourceError ? "preview" : "commit";
    record.error = sourceError;
    record.onError = onError;
    if (sourceError) onError?.(sourceError, String(code));
    schedule(coordinator);
  }, [code, coordinator, isIncomplete, onError, sourceError]);

  const body = createElement(
    "div",
    { className: "slex-streamdown-body" },
    isIncomplete ? (placeholder ?? createElement("div", { className: "slex-streamdown-placeholder" }, "Rendering SlexKit...")) : null,
    renderError(sourceError ?? runtimeError),
    createElement("div", { ref: hostRef }),
  );
  const source = showSource
    ? createElement("details", { className: "slex-streamdown-source" },
        createElement("summary", null, "Source"),
        createElement("pre", null, createElement("code", null, code)))
    : null;

  if (!showChrome) {
    return createElement("div", {
      className: ["slex-streamdown-block", className].filter(Boolean).join(" "),
    }, body, source);
  }
  return createElement(
    CodeBlockContainer,
    { className: ["slex-streamdown-block", className].filter(Boolean).join(" "), isIncomplete, language },
    createElement(CodeBlockHeader, { language }),
    createElement("div", { className: "slex-streamdown-toolbar" },
      createElement("button", { className: "slex-streamdown-copy", type: "button", onClick: () => void copySource(String(code)) }, "Copy source")),
    body,
    source,
  );
}

export function SlexKitRenderer(props: SlexKitRendererProps): ReactNode {
  return createElement(Renderer, props);
}

export function createSlexKitRenderer(options: SlexKitRendererOptions = {}): CustomRenderer {
  const { languages, ...rendererOptions } = options;
  const coordinator: Coordinator = {
    artifactId: rendererOptions.domain ?? newArtifactId(),
    host: createHost(rendererOptions),
    blocks: new Map(),
    scheduled: false,
    pending: Promise.resolve(),
  };
  return {
    language: languageList(languages),
    component: (props) => createElement(Renderer, { ...props, ...rendererOptions, coordinator }),
  };
}

export const slexkitRenderer = createSlexKitRenderer();
