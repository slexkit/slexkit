import type {
  HostRuntimeAdapter,
  HostRuntimePolicy,
  NetworkResult,
  SlexKitRuntimeApi,
} from "../engine/secure-runtime";

export type HtmlDiagnosticSeverity = "error" | "warning";

export type HtmlSourcePosition = {
  offset: number;
  line: number;
  column: number;
};

export type HtmlSourceDiagnostic = {
  code: string;
  message: string;
  severity: HtmlDiagnosticSeverity;
  start?: HtmlSourcePosition;
  end?: HtmlSourcePosition;
};

export type HtmlInspectionResult = {
  ok: boolean;
  value?: string;
  diagnostic?: HtmlSourceDiagnostic;
  error?: SyntaxError | TypeError;
  warnings: HtmlSourceDiagnostic[];
  diagnostics?: HtmlSourceDiagnostic[];
};

export type HtmlValidationResult = {
  ok: boolean;
  valid: boolean;
  diagnostics: HtmlSourceDiagnostic[];
  warnings: HtmlSourceDiagnostic[];
  errors: HtmlSourceDiagnostic[];
};

export type SlexKitMarkdownRuntimeMode = "secure" | "trusted";
export type HtmlUpdatePhase = "preview" | "commit";
export type HtmlTheme = "light" | "dark" | "system" | string;

export type HtmlSecureFrameOptions = {
  runtimeUrl?: string;
  styleUrl?: string | false;
  /** Exact font assets admitted by the frame CSP. Empty by default. */
  fontUrls?: readonly string[];
  /** Exact image assets admitted by the frame CSP. data:/blob: are not implicit. */
  imageUrls?: readonly string[];
  className?: string;
  title?: string;
  loadTimeoutMs?: number;
  teardownTimeoutMs?: number;
};

/** Compatibility alias for the HTML frame shape. */
export type SecureFrameOptions = HtmlSecureFrameOptions;

export type SlexKitMarkdownRuntimeOptions = {
  /** Kept for host compatibility. HTML always runs in an isolated frame. */
  mode?: SlexKitMarkdownRuntimeMode;
  trusted?: boolean;
  policy?: HostRuntimePolicy;
  hostAdapter?: HostRuntimeAdapter;
  secureFrame?: boolean | HtmlSecureFrameOptions;
  runtimeUrl?: string;
  styleUrl?: string | false;
  fontUrls?: readonly string[];
  imageUrls?: readonly string[];
  theme?: HtmlTheme;
  dir?: "ltr" | "rtl" | "auto";
  loadTimeoutMs?: number;
  /** Copied into each artifact's isolated JSON state when that artifact is first created. */
  shared?: Record<string, unknown>;
};

export type SlexKitMarkdownBlock = {
  artifactId?: string;
  blockId?: string;
  namespace?: string;
  source: string;
  container: HTMLElement;
  theme?: HtmlTheme;
  dir?: "ltr" | "rtl" | "auto";
  executionMode?: "live" | "preview";
};

export type SlexKitArtifactUpdateOptions = {
  phase: HtmlUpdatePhase;
  reset?: boolean;
};

export type SlexKitMarkdownRuntimeHost = {
  configure(options: Partial<SlexKitMarkdownRuntimeOptions>): void;
  getMode(): SlexKitMarkdownRuntimeMode;
  mountBlock(block: SlexKitMarkdownBlock): () => void;
  disposeBlock(container: HTMLElement): void;
  disposeArtifact(artifactId: string): void;
  disposeAll(): void;
  updateArtifact(
    artifactId: string,
    blocks: readonly SlexKitMarkdownBlock[],
    options: SlexKitArtifactUpdateOptions,
  ): Promise<void>;
  resetArtifact(artifactId: string): Promise<void>;
};

export type SlexKitUpdatableMarkdownRuntimeHost = SlexKitMarkdownRuntimeHost;

export type HtmlMountOptions = SlexKitMarkdownRuntimeOptions & {
  artifactId?: string;
  blockId?: string;
};

export type HtmlMountHandle = (() => void) & {
  ready: Promise<void>;
  update(source: string, options?: { reset?: boolean }): Promise<void>;
  reset(): Promise<void>;
  snapshot(): Promise<unknown>;
};

export type SlexSharedState = {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): Promise<void>;
  subscribe(key: string, listener: (value: unknown) => void): () => void;
};

export type SlexDocumentSdk = {
  root: HTMLElement;
  /** Aborted before this module scope is replaced or disposed. */
  readonly signal: AbortSignal;
  onDispose(callback: () => void | Promise<void>): void;
  onSnapshot(callback: () => unknown | Promise<unknown>): void;
  onRestore(callback: (snapshot: unknown) => void | Promise<void>): void;
  api: SlexKitRuntimeApi;
  shared: SlexSharedState;
};

export type HtmlPolicyFetchHandler = (
  url: string,
  options: Record<string, unknown>,
) => Promise<NetworkResult>;
