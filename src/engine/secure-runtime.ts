import type { MountOptions } from "./types";

export type NetworkMethod = "GET" | "POST";
export type RuntimeCredentials = "omit" | "same-origin" | "include";

export type HostRuntimePolicy = {
  network?: {
    enabled: boolean;
    methods: NetworkMethod[];
    allowOrigins: string[];
    allowHeaders?: string[];
    allowContentTypes?: string[];
    credentials: RuntimeCredentials;
    timeoutMs: number;
    maxBodyBytes: number;
    maxResponseBytes?: number;
  };
  timer?: {
    enabled: boolean;
    maxTimers: number;
    minIntervalMs: number;
  };
  animation?: {
    enabled: boolean;
  };
  canvas?: {
    enabled: boolean;
    maxCanvases?: number;
    maxPixels?: number;
    allowedContexts?: RuntimeCanvasContextId[];
  };
  execution?: {
    heartbeatIntervalMs?: number;
    maxUnresponsiveMs?: number;
  };
};

export type RuntimeCanvasContextId = "2d" | "webgl" | "webgl2" | "bitmaprenderer";
export type RuntimeCanvasContext =
  | CanvasRenderingContext2D
  | WebGLRenderingContext
  | WebGL2RenderingContext
  | ImageBitmapRenderingContext;

export type NetworkOptions = {
  method?: NetworkMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  credentials?: RuntimeCredentials;
};

export type NetworkResult = {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  headers: Record<string, string>;
  text?: string;
  data?: unknown;
  elapsedMs: number;
};

export type TimerId = number;
export type RafId = number;

export type HostFetchRequest = {
  method: NetworkMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  credentials: RuntimeCredentials;
  timeoutMs: number;
};

export type RuntimeNetworkLogEvent = {
  phase: "request" | "response" | "error";
  request: HostFetchRequest;
  result?: NetworkResult;
  error?: SerializedRuntimeError;
  elapsedMs?: number;
};

export type RuntimeErrorEvent = {
  phase: "timer" | "interval" | "raf" | "dispose";
  error: SerializedRuntimeError;
};

export type HostRuntimeAdapter = {
  fetch?: (request: HostFetchRequest) => Promise<NetworkResult>;
  onNetworkLog?: (event: RuntimeNetworkLogEvent) => void;
  onRuntimeError?: (event: RuntimeErrorEvent) => void;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => TimerId;
  clearTimeout?: (id: TimerId) => void;
  setInterval?: (fn: () => void, ms: number) => TimerId;
  clearInterval?: (id: TimerId) => void;
  requestAnimationFrame?: (fn: (time: number) => void) => RafId;
  cancelAnimationFrame?: (id: RafId) => void;
};

export type SlexKitRuntimeApi = {
  now: () => number;
  get: (url: string, options?: Omit<NetworkOptions, "method" | "body">) => Promise<NetworkResult>;
  post: (url: string, body?: unknown, options?: Omit<NetworkOptions, "method" | "body">) => Promise<NetworkResult>;
  fetch: (url: string, options?: NetworkOptions) => Promise<NetworkResult>;
  setTimeout: (fn: () => void, ms: number) => TimerId;
  clearTimeout: (id: TimerId) => void;
  setInterval: (fn: () => void, ms: number) => TimerId;
  clearInterval: (id: TimerId) => void;
  raf: (fn: (time: number) => void) => RafId;
  cancelRaf: (id: RafId) => void;
  createCanvas: (width: number, height: number) => HTMLCanvasElement;
  getCanvasContext: (
    canvas: HTMLCanvasElement,
    contextId?: RuntimeCanvasContextId,
    options?: CanvasRenderingContext2DSettings | WebGLContextAttributes | ImageBitmapRenderingContextSettings,
  ) => RuntimeCanvasContext;
  onDispose: (fn: () => void) => void;
  isTimeoutError: (error: unknown) => boolean;
  isNetworkError: (error: unknown) => boolean;
  isPolicyError: (error: unknown) => boolean;
  errorMessage: (error: unknown) => string;
};

export type SecureRuntimeHandle = {
  api: SlexKitRuntimeApi;
  dispose: () => void;
};

export type SecureFrameOptions = {
  className?: string;
  title?: string;
  sandbox?: string;
  unsafeAllowSameOrigin?: boolean;
  runtimeUrl?: string;
  styleUrl?: string | false;
  loadTimeoutMs?: number;
  /**
   * @deprecated Use runtimeUrl. The runner is now shipped inside the main SlexKit runtime module.
   */
  runnerUrl?: string;
};

export type SecureMountOptions = Omit<MountOptions, "api"> & {
  policy: HostRuntimePolicy;
  hostAdapter?: HostRuntimeAdapter;
  frame?: boolean | SecureFrameOptions;
  unsafeInlineExecution?: boolean;
  artifactSlots?: SecureArtifactSlot[];
};

export type SecureArtifactSlot = {
  id: string;
  container: HTMLElement;
};

export type SandboxMountMessage = {
  channel: "slexkit-secure";
  type: "mount";
  id: string;
  token: string;
  input: unknown;
  policy: HostRuntimePolicy;
  theme?: MountOptions["theme"];
  colorMode?: "light" | "dark";
  dir?: MountOptions["dir"];
  labels?: MountOptions["labels"];
};

export type SandboxDisposeMessage = {
  channel: "slexkit-secure";
  type: "dispose";
  id: string;
  token: string;
};

export type SandboxFetchRequestMessage = {
  channel: "slexkit-secure";
  type: "fetch";
  id: string;
  token: string;
  requestId: string;
  request: HostFetchRequest;
};

export type SandboxFetchResponseMessage = {
  channel: "slexkit-secure";
  type: "fetch-result";
  id: string;
  token: string;
  requestId: string;
  result?: NetworkResult;
  error?: SerializedRuntimeError;
};

export type SandboxSlotsMessage = {
  channel: "slexkit-secure";
  type: "slots";
  id: string;
  token: string;
  slots: Array<{
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
};

export type SandboxSlotSizeMessage = {
  channel: "slexkit-secure";
  type: "slot-size";
  id: string;
  token: string;
  slotId: string;
  height: number;
};

export type SandboxFrameSizeMessage = {
  channel: "slexkit-secure";
  type: "frame-size";
  id: string;
  token: string;
  height: number;
};

export type SandboxStatusMessage = {
  channel: "slexkit-secure";
  type: "ready" | "mounted" | "heartbeat" | "disposed" | "error";
  id?: string;
  token?: string;
  error?: SerializedRuntimeError;
};

export type SandboxHostMessage =
  | SandboxMountMessage
  | SandboxDisposeMessage
  | SandboxFetchResponseMessage
  | SandboxSlotsMessage;

export type SandboxRunnerMessage =
  | SandboxFetchRequestMessage
  | SandboxFrameSizeMessage
  | SandboxSlotSizeMessage
  | SandboxStatusMessage;

export type SerializedRuntimeError = {
  name: string;
  message: string;
  kind?: RuntimeErrorKind;
  code?: string;
  elapsedMs?: number;
};

export type RuntimeErrorKind = "policy" | "network" | "timeout";

export class SlexKitRuntimeError extends Error {
  kind: RuntimeErrorKind;
  code: string;
  elapsedMs?: number;

  constructor(kind: RuntimeErrorKind, code: string, message: string, elapsedMs?: number) {
    super(message);
    this.name = "SlexKitRuntimeError";
    this.kind = kind;
    this.code = code;
    this.elapsedMs = elapsedMs;
  }
}

function runtimeNow(adapter?: HostRuntimeAdapter): number {
  if (adapter?.now) return adapter.now();
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function currentOrigin(): string {
  if (typeof location !== "undefined" && location.origin) return location.origin;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "http://localhost";
}

function resolveUrl(url: string): URL {
  try {
    return new URL(url, currentOrigin());
  } catch {
    throw new SlexKitRuntimeError("policy", "invalid_url", "Invalid request URL.");
  }
}

function originAllowed(origin: string, patterns: string[]): boolean {
  let parsedOrigin: URL | undefined;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }
  for (const pattern of patterns) {
    const normalized = pattern.trim();
    if (normalized === "*" || normalized === origin) return true;
    if (normalized.endsWith("://*")) {
      const protocol = normalized.slice(0, -4);
      if (parsedOrigin.protocol === `${protocol}:`) return true;
    }
    const wildcard = normalized.match(/^([a-z][a-z0-9+.-]*):\/\/\*\.(.+)$/i);
    if (wildcard && parsedOrigin.protocol === `${wildcard[1]}:`) {
      const suffix = wildcard[2].toLowerCase();
      const host = parsedOrigin.hostname.toLowerCase();
      if (host.endsWith(`.${suffix}`)) return true;
    }
  }
  return false;
}

function needsJsonBody(method: NetworkMethod, body: unknown): boolean {
  if (method !== "POST" || body === undefined) return false;
  return !(
    typeof body === "string" ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

function bodySize(body: unknown): number {
  if (body === undefined || body === null) return 0;
  if (typeof body === "string") return body.length;
  if (body instanceof ArrayBuffer) return body.byteLength;
  if (ArrayBuffer.isView(body)) return body.byteLength;
  return JSON.stringify(body).length;
}

const DEFAULT_ALLOWED_HEADERS = ["accept", "content-type"];
const BLOCKED_HEADERS = [
  "authorization",
  "cookie",
  "proxy-authorization",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "sec-fetch-user",
  "set-cookie",
];

function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

function assertHeaders(headers: Record<string, string> | undefined, allowHeaders?: string[]): void {
  if (!headers) return;
  const allowed = new Set((allowHeaders ?? DEFAULT_ALLOWED_HEADERS).map(normalizeHeaderName));
  for (const [name, value] of Object.entries(headers)) {
    const normalized = normalizeHeaderName(name);
    if (!normalized || typeof value !== "string") {
      throw new SlexKitRuntimeError("policy", "header_blocked", "Request header is not allowed.");
    }
    if (BLOCKED_HEADERS.includes(normalized) || !allowed.has(normalized)) {
      throw new SlexKitRuntimeError("policy", "header_blocked", `Request header ${name} is not allowed.`);
    }
  }
}

function responseSize(result: NetworkResult): number {
  if (typeof result.text === "string") return result.text.length;
  if (result.data !== undefined) {
    try {
      return JSON.stringify(result.data).length;
    } catch {
      return 0;
    }
  }
  return 0;
}

function contentTypeAllowed(contentType: string, patterns: string[]): boolean {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  if (!normalized) return false;
  return patterns.some((pattern) => {
    const allowed = pattern.trim().toLowerCase();
    if (allowed === "*" || allowed === normalized) return true;
    if (allowed.endsWith("/*")) {
      return normalized.startsWith(`${allowed.slice(0, -1)}`);
    }
    return false;
  });
}

function responseHeader(headers: Record<string, string>, name: string): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}

function assertNetworkResult(result: NetworkResult, policy: HostRuntimePolicy["network"]): void {
  if (!policy) return;
  if (policy.maxResponseBytes !== undefined && responseSize(result) > policy.maxResponseBytes) {
    throw new SlexKitRuntimeError("policy", "response_too_large", "Response body exceeds the runtime policy limit.", result.elapsedMs);
  }
  if (policy.allowContentTypes?.length) {
    const contentType = responseHeader(result.headers, "content-type");
    if (!contentType || !contentTypeAllowed(contentType, policy.allowContentTypes)) {
      throw new SlexKitRuntimeError("policy", "content_type_blocked", `Response content-type ${contentType || "unknown"} is not allowed.`, result.elapsedMs);
    }
  }
}

function canvasPolicy(policy: HostRuntimePolicy): NonNullable<HostRuntimePolicy["canvas"]> {
  const canvas = policy.canvas;
  if (!canvas?.enabled) {
    throw new SlexKitRuntimeError("policy", "canvas_disabled", "Canvas access is disabled.");
  }
  return canvas;
}

function assertCanvasDimensions(policy: NonNullable<HostRuntimePolicy["canvas"]>, width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new SlexKitRuntimeError("policy", "canvas_size_invalid", "Canvas size must be positive finite numbers.");
  }
  const pixels = Math.ceil(width) * Math.ceil(height);
  if (policy.maxPixels !== undefined && pixels > policy.maxPixels) {
    throw new SlexKitRuntimeError("policy", "canvas_too_large", "Canvas size exceeds the runtime policy limit.");
  }
}

function assertCanvasContext(policy: NonNullable<HostRuntimePolicy["canvas"]>, contextId: RuntimeCanvasContextId): void {
  if (policy.allowedContexts?.length && !policy.allowedContexts.includes(contextId)) {
    throw new SlexKitRuntimeError("policy", "canvas_context_blocked", `Canvas context ${contextId} is not allowed.`);
  }
}

function emitNetworkLog(adapter: HostRuntimeAdapter | undefined, event: RuntimeNetworkLogEvent): void {
  try {
    adapter?.onNetworkLog?.(event);
  } catch {
    // Logging hooks must never change runtime behavior.
  }
}

function emitRuntimeError(adapter: HostRuntimeAdapter | undefined, event: RuntimeErrorEvent): void {
  try {
    adapter?.onRuntimeError?.(event);
  } catch {
    // Error hooks are observational and must not mask the original failure.
  }
}

function timerHost(adapter?: HostRuntimeAdapter) {
  const globalTimer = globalThis as typeof globalThis & {
    setTimeout: (fn: () => void, ms: number) => unknown;
    clearTimeout: (id: unknown) => void;
    setInterval: (fn: () => void, ms: number) => unknown;
    clearInterval: (id: unknown) => void;
  };
  return {
    setTimeout: adapter?.setTimeout ?? ((fn: () => void, ms: number) => Number(globalTimer.setTimeout(fn, ms))),
    clearTimeout: adapter?.clearTimeout ?? ((id: TimerId) => globalTimer.clearTimeout(id)),
    setInterval: adapter?.setInterval ?? ((fn: () => void, ms: number) => Number(globalTimer.setInterval(fn, ms))),
    clearInterval: adapter?.clearInterval ?? ((id: TimerId) => globalTimer.clearInterval(id)),
  };
}

function rafHost(adapter?: HostRuntimeAdapter) {
  const globalRaf = globalThis as typeof globalThis & {
    requestAnimationFrame?: (fn: (time: number) => void) => unknown;
    cancelAnimationFrame?: (id: unknown) => void;
  };
  return {
    requestAnimationFrame:
      adapter?.requestAnimationFrame ??
      ((fn: (time: number) => void) => {
        if (typeof globalRaf.requestAnimationFrame === "function") {
          return Number(globalRaf.requestAnimationFrame(fn));
        }
        return Number(globalThis.setTimeout(() => fn(runtimeNow(adapter)), 16));
      }),
    cancelAnimationFrame:
      adapter?.cancelAnimationFrame ??
      ((id: RafId) => {
        if (typeof globalRaf.cancelAnimationFrame === "function") {
          globalRaf.cancelAnimationFrame(id);
        } else {
          globalThis.clearTimeout(id);
        }
      }),
  };
}

async function readResponseText(response: Response, maxResponseBytes: number | undefined): Promise<string> {
  if (maxResponseBytes === undefined || !response.body?.getReader) {
    const text = await response.text();
    if (maxResponseBytes !== undefined && text.length > maxResponseBytes) {
      throw new SlexKitRuntimeError("policy", "response_too_large", "Response body exceeds the runtime policy limit.");
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxResponseBytes) {
      await reader.cancel();
      throw new SlexKitRuntimeError("policy", "response_too_large", "Response body exceeds the runtime policy limit.");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

async function defaultFetch(
  request: HostFetchRequest,
  adapter?: HostRuntimeAdapter,
  options: {
    maxResponseBytes?: number;
    onController?: (controller: AbortController) => () => void;
  } = {},
): Promise<NetworkResult> {
  if (adapter?.fetch) return adapter.fetch(request);
  if (typeof fetch !== "function") {
    throw new SlexKitRuntimeError("network", "fetch_unavailable", "Host fetch is unavailable.");
  }

  const start = runtimeNow(adapter);
  const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const releaseController = controller ? options.onController?.(controller) : undefined;
  const timeout = controller
    ? globalThis.setTimeout(() => controller.abort(), request.timeoutMs)
    : undefined;

  try {
    const init: RequestInit = {
      method: request.method,
      headers: request.headers,
      credentials: request.credentials,
      signal: controller?.signal,
    };
    if (request.method === "POST" && request.body !== undefined) {
      if (
        typeof request.body === "string" ||
        request.body instanceof ArrayBuffer ||
        ArrayBuffer.isView(request.body)
      ) {
        init.body = request.body as BodyInit;
      } else {
    init.body = JSON.stringify(request.body);
    init.headers = request.headers;
      }
    }

    const response = await fetch(request.url, init);
    const text = await readResponseText(response, options.maxResponseBytes);
    let data: unknown = undefined;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers,
      text,
      data,
      elapsedMs: runtimeNow(adapter) - start,
    };
  } catch (error) {
    const elapsedMs = runtimeNow(adapter) - start;
    if (error instanceof Error && error.name === "AbortError") {
      throw new SlexKitRuntimeError("timeout", "timeout", "Request timed out.", elapsedMs);
    }
    throw new SlexKitRuntimeError("network", "network_error", errorMessage(error), elapsedMs);
  } finally {
    if (timeout !== undefined) globalThis.clearTimeout(timeout);
    releaseController?.();
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? "Unknown error.");
}

export function serializeRuntimeError(error: unknown): SerializedRuntimeError {
  if (error instanceof SlexKitRuntimeError) {
    return {
      name: error.name,
      message: error.message,
      kind: error.kind,
      code: error.code,
      elapsedMs: error.elapsedMs,
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return {
    name: "Error",
    message: errorMessage(error),
  };
}

export function deserializeRuntimeError(error: SerializedRuntimeError): Error {
  if (error.name === "SlexKitRuntimeError" && error.kind && error.code) {
    return new SlexKitRuntimeError(error.kind, error.code, error.message, error.elapsedMs);
  }
  const next = new Error(error.message);
  next.name = error.name || "Error";
  return next;
}

export function createSecureRuntime(
  policy: HostRuntimePolicy,
  hostAdapter?: HostRuntimeAdapter,
): SecureRuntimeHandle {
  const disposers = new Set<() => void>();
  const timeoutIds = new Set<TimerId>();
  const intervalIds = new Set<TimerId>();
  const rafIds = new Set<RafId>();
  const abortControllers = new Set<AbortController>();
  const ownedCanvases = new Set<HTMLCanvasElement>();
  const countedCanvases = new Set<HTMLCanvasElement>();
  let disposed = false;
  let nextSyntheticId = 1;
  const syntheticTimers = new Map<TimerId, unknown>();
  const timers = timerHost(hostAdapter);
  const raf = rafHost(hostAdapter);

  function assertNotDisposed(): void {
    if (disposed) {
      throw new SlexKitRuntimeError("policy", "runtime_disposed", "Runtime has been disposed.");
    }
  }

  function assertNetwork(method: NetworkMethod, url: string, options: NetworkOptions = {}): HostFetchRequest {
    const network = policy.network;
    if (!network?.enabled) {
      throw new SlexKitRuntimeError("policy", "network_disabled", "Network access is disabled.");
    }
    if (!network.methods.includes(method)) {
      throw new SlexKitRuntimeError("policy", "method_blocked", `Network method ${method} is not allowed.`);
    }
    const parsed = resolveUrl(url);
    if (!originAllowed(parsed.origin, network.allowOrigins)) {
      throw new SlexKitRuntimeError("policy", "origin_blocked", `Network origin ${parsed.origin} is not allowed.`);
    }
    if (method === "POST" && bodySize(options.body) > network.maxBodyBytes) {
      throw new SlexKitRuntimeError("policy", "body_too_large", "Request body exceeds the runtime policy limit.");
    }
    const headers = needsJsonBody(method, options.body)
      ? { "content-type": "application/json", ...options.headers }
      : options.headers;
    assertHeaders(headers, network.allowHeaders);
    const timeoutMs = Math.min(options.timeoutMs ?? network.timeoutMs, network.timeoutMs);
    const credentials = options.credentials ?? network.credentials;
    if (credentials !== network.credentials) {
      throw new SlexKitRuntimeError("policy", "credentials_blocked", "Request credentials mode is not allowed.");
    }
    return {
      method,
      url: parsed.href,
      headers,
      body: options.body,
      credentials,
      timeoutMs,
    };
  }

  function assertTimer(ms: number): void {
    const timer = policy.timer;
    if (!timer?.enabled) {
      throw new SlexKitRuntimeError("policy", "timer_disabled", "Timer access is disabled.");
    }
    if (!Number.isFinite(ms) || ms < timer.minIntervalMs) {
      throw new SlexKitRuntimeError("policy", "timer_interval_blocked", "Timer interval is below policy limit.");
    }
    if (timeoutIds.size + intervalIds.size >= timer.maxTimers) {
      throw new SlexKitRuntimeError("policy", "timer_limit", "Timer limit exceeded.");
    }
  }

  function normalizeTimerId(raw: TimerId): TimerId {
    if (Number.isFinite(raw) && raw > 0) return raw;
    const synthetic = nextSyntheticId++;
    syntheticTimers.set(synthetic, raw);
    return synthetic;
  }

  function assertCanvas(width: number, height: number): NonNullable<HostRuntimePolicy["canvas"]> {
    assertNotDisposed();
    const canvas = canvasPolicy(policy);
    assertCanvasDimensions(canvas, width, height);
    if (canvas.maxCanvases !== undefined && countedCanvases.size >= canvas.maxCanvases) {
      throw new SlexKitRuntimeError("policy", "canvas_limit", "Canvas limit exceeded.");
    }
    return canvas;
  }

  function countCanvas(canvas: HTMLCanvasElement, policy: NonNullable<HostRuntimePolicy["canvas"]>): void {
    if (countedCanvases.has(canvas)) return;
    if (policy.maxCanvases !== undefined && countedCanvases.size >= policy.maxCanvases) {
      throw new SlexKitRuntimeError("policy", "canvas_limit", "Canvas limit exceeded.");
    }
    countedCanvases.add(canvas);
  }

  function reportCallbackError(phase: RuntimeErrorEvent["phase"], error: unknown): void {
    emitRuntimeError(hostAdapter, {
      phase,
      error: serializeRuntimeError(error),
    });
  }

  const api: SlexKitRuntimeApi = {
    now: () => runtimeNow(hostAdapter),
    get: (url, options = {}) => api.fetch(url, { ...options, method: "GET" }),
    post: (url, body, options = {}) => api.fetch(url, { ...options, method: "POST", body }),
    fetch: async (url, options = {}) => {
      assertNotDisposed();
      const method = options.method ?? "GET";
      const request = assertNetwork(method, url, options);
      const started = runtimeNow(hostAdapter);
      emitNetworkLog(hostAdapter, { phase: "request", request });
      try {
        const result = await defaultFetch(request, hostAdapter, {
          maxResponseBytes: policy.network?.maxResponseBytes,
          onController(controller) {
            abortControllers.add(controller);
            return () => abortControllers.delete(controller);
          },
        });
        assertNetworkResult(result, policy.network);
        emitNetworkLog(hostAdapter, {
          phase: "response",
          request,
          result,
          elapsedMs: runtimeNow(hostAdapter) - started,
        });
        return result;
      } catch (error) {
        const serialized = serializeRuntimeError(error);
        emitNetworkLog(hostAdapter, {
          phase: "error",
          request,
          error: serialized,
          elapsedMs: runtimeNow(hostAdapter) - started,
        });
        throw error;
      }
    },
    setTimeout: (fn, ms) => {
      assertNotDisposed();
      assertTimer(ms);
      let id = 0;
      const raw = timers.setTimeout(() => {
        timeoutIds.delete(id);
        syntheticTimers.delete(id);
        try {
          fn();
        } catch (error) {
          reportCallbackError("timer", error);
          throw error;
        }
      }, ms);
      id = normalizeTimerId(raw);
      timeoutIds.add(id);
      return id;
    },
    clearTimeout: (id) => {
      const raw = syntheticTimers.get(id) ?? id;
      timers.clearTimeout(raw as TimerId);
      timeoutIds.delete(id);
      syntheticTimers.delete(id);
    },
    setInterval: (fn, ms) => {
      assertNotDisposed();
      assertTimer(ms);
      const id = normalizeTimerId(timers.setInterval(() => {
        try {
          fn();
        } catch (error) {
          reportCallbackError("interval", error);
          throw error;
        }
      }, ms));
      intervalIds.add(id);
      return id;
    },
    clearInterval: (id) => {
      const raw = syntheticTimers.get(id) ?? id;
      timers.clearInterval(raw as TimerId);
      intervalIds.delete(id);
      syntheticTimers.delete(id);
    },
    raf: (fn) => {
      assertNotDisposed();
      if (!policy.animation?.enabled) {
        throw new SlexKitRuntimeError("policy", "animation_disabled", "Animation access is disabled.");
      }
      const id = raf.requestAnimationFrame((time) => {
        rafIds.delete(id);
        try {
          fn(time);
        } catch (error) {
          reportCallbackError("raf", error);
          throw error;
        }
      });
      rafIds.add(id);
      return id;
    },
    cancelRaf: (id) => {
      raf.cancelAnimationFrame(id);
      rafIds.delete(id);
    },
    createCanvas: (width, height) => {
      assertCanvas(width, height);
      if (typeof document === "undefined" || typeof document.createElement !== "function") {
        throw new SlexKitRuntimeError("policy", "canvas_unavailable", "Canvas is unavailable in this runtime.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width);
      canvas.height = Math.ceil(height);
      ownedCanvases.add(canvas);
      countedCanvases.add(canvas);
      return canvas;
    },
    getCanvasContext: (canvas, contextId = "2d", options) => {
      assertNotDisposed();
      const canvasAccess = canvasPolicy(policy);
      assertCanvasDimensions(canvasAccess, canvas.width, canvas.height);
      assertCanvasContext(canvasAccess, contextId);
      countCanvas(canvas, canvasAccess);
      const context = canvas.getContext(contextId as "2d", options as CanvasRenderingContext2DSettings);
      if (!context) {
        throw new SlexKitRuntimeError("policy", "canvas_context_unavailable", `Canvas context ${contextId} is unavailable.`);
      }
      return context as RuntimeCanvasContext;
    },
    onDispose: (fn) => {
      disposers.add(fn);
    },
    isTimeoutError: (error) => error instanceof SlexKitRuntimeError && error.kind === "timeout",
    isNetworkError: (error) => error instanceof SlexKitRuntimeError && error.kind === "network",
    isPolicyError: (error) => error instanceof SlexKitRuntimeError && error.kind === "policy",
    errorMessage,
  };

  return {
    api,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      for (const id of Array.from(timeoutIds)) api.clearTimeout(id);
      for (const id of Array.from(intervalIds)) api.clearInterval(id);
      for (const id of Array.from(rafIds)) api.cancelRaf(id);
      for (const controller of Array.from(abortControllers)) controller.abort();
      abortControllers.clear();
      for (const canvas of Array.from(ownedCanvases)) {
        if (canvas.isConnected) canvas.remove();
      }
      ownedCanvases.clear();
      countedCanvases.clear();
      for (const disposer of Array.from(disposers)) {
        try {
          disposer();
        } catch (error) {
          reportCallbackError("dispose", error);
        }
      }
      disposers.clear();
    },
  };
}
