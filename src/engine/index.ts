import { deleteStore, getStore, peekStore } from "./store";
import { deepMerge } from "./merge";
import { renderTree } from "./renderer";
import { createRoot } from "./reactive";
import { clearEvalCache } from "./eval";
import { parseSlexSource } from "./diagnostics";
import { SLEX_PROTOCOL_VERSION } from "../version";
import type { DirectionMode, SlexExpression, MountOptions, ThemeMode } from "./types";
import {
  createSecureRuntime,
  serializeRuntimeError,
} from "./secure-runtime";
import type { HostFetchRequest, SecureArtifactSlot, SecureMountOptions } from "./secure-runtime";

let defaultRuntimeUrl: string | undefined =
  typeof document !== "undefined" &&
  typeof document.currentScript === "object" &&
  document.currentScript &&
  "src" in document.currentScript
    ? String(document.currentScript.src || "")
    : undefined;

export { register, getRenderer } from "./registry";
export {
  diagnoseSlexKitSource,
  SlexKitSyntaxError,
  formatSlexKitDiagnostic,
  parseSlexSource,
  parseSlexKitDsl,
} from "./diagnostics";
export type { SlexKitParseResult, SlexKitSourceDiagnostic } from "./diagnostics";
export { validateSlexSource } from "./validation";
export type {
  SlexKitValidationMode,
  SlexKitValidationOptions,
  SlexKitValidationResult,
  SlexKitValidationWarning,
  SlexKitValidationWarningCode,
} from "./validation";
export { runSlexConformance } from "./conformance";
export type {
  SlexConformanceCaseResult,
  SlexConformanceExpectedWarning,
  SlexConformanceFixture,
  SlexConformanceOptions,
  SlexConformanceReport,
} from "./conformance";
export type {
  ComponentRegistrationOptions,
  ComponentRenderer,
  ComponentStateMode,
  MountOptions,
  RenderContext,
  SlexExpression,
  ThemeMode,
  /** @deprecated Use SlexExpression instead. */
  DSL,
} from "./types";
export {
  createSecureRuntime,
  SlexKitRuntimeError,
  serializeRuntimeError,
} from "./secure-runtime";
export { slexkitStd } from "./stdlib";
export type { SlexKitStdlib } from "./stdlib";
export {
  slexkitExpressionContext,
  slexkitRuntimeCapabilities,
  slexkitRuntimeCapabilityNames,
  slexkitStdlibDocs,
  slexkitStdlibFunctionNames,
} from "./capabilities";
export type {
  SlexKitRuntimeCapabilityDoc,
  SlexKitStdlibFunctionDoc,
  SlexKitStdlibNamespaceDoc,
} from "./capabilities";
export {
  createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost,
} from "./markdown-runtime";
export type {
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
  SlexKitMarkdownRuntimeMode,
  SlexKitMarkdownRuntimeOptions,
} from "./markdown-runtime";
export type {
  SlexKitRuntimeApi,
  HostFetchRequest,
  HostRuntimeAdapter,
  HostRuntimePolicy,
  NetworkOptions,
  NetworkResult,
  RafId,
  RuntimeCanvasContext,
  RuntimeCanvasContextId,
  RuntimeErrorEvent,
  RuntimeErrorKind,
  RuntimeNetworkLogEvent,
  SandboxSlotSizeMessage,
  SandboxSlotsMessage,
  SandboxFetchRequestMessage,
  SandboxFetchResponseMessage,
  SandboxHostMessage,
  SandboxMountMessage,
  SandboxRunnerMessage,
  SandboxStatusMessage,
  SecureFrameOptions,
  SecureArtifactSlot,
  SecureMountOptions,
  SecureRuntimeHandle,
  SerializedRuntimeError,
  TimerId,
} from "./secure-runtime";

export function setSlexKitRuntimeUrl(url: string | undefined): void {
  defaultRuntimeUrl = url || undefined;
}

export function getSlexKitRuntimeUrl(): string | undefined {
  return defaultRuntimeUrl;
}

function normalizeExpression(input: SlexExpression): SlexExpression {
  if (!input || typeof input !== "object") return input;
  const hasProtocolMarker = "slex" in input;
  const hasEnvelopeField = "namespace" in input || "g" in input || "layout" in input;
  if (hasEnvelopeField) return input;

  const keys = Object.keys(input);
  if (keys.some((key) => key.includes(":"))) {
    const { slex, ...layout } = input;
    return {
      ...(hasProtocolMarker ? { slex } : {}),
      namespace: "default",
      g: {},
      layout: layout as SlexExpression["layout"],
    };
  }

  return input;
}

function warnUnsupportedProtocol(expression: SlexExpression): void {
  if (expression.slex === undefined || expression.slex === SLEX_PROTOCOL_VERSION) return;
  console.warn(
    `[SlexKit] Slex protocol marker '${String(expression.slex)}' does not match supported protocol '${SLEX_PROTOCOL_VERSION}'.`,
  );
}

function parseSourceOrExpression(input: SlexExpression | string): SlexExpression | undefined {
  if (typeof input !== "string") return normalizeExpression(input);

  const parsed = parseSlexSource(input);
  if (!parsed.ok) {
    console.warn("[SlexKit] Failed to parse Slex source:", parsed.error.message);
    return undefined;
  }
  return normalizeExpression(parsed.value as SlexExpression);
}

function applyExpression(expression: SlexExpression): void {
  warnUnsupportedProtocol(expression);
  const ns = expression.namespace || "default";
  const store = getStore(ns);

  if (expression.g) {
    try {
      deepMerge(store.g, expression.g);
    } catch (e) {
      console.warn(`[SlexKit][${ns}] Merge error, replacing entire g:`, (e as Error).message);
      for (const k of Object.keys(store.g)) {
        delete store.g[k];
      }
      Object.assign(store.g, expression.g);
    }
  }

  if (expression.layout) {
    store.layouts = [expression.layout];
  }
}

function hasThemeToken(el: HTMLElement, token: string): boolean {
  return getComputedStyle(el).getPropertyValue(token).trim().length > 0;
}

function resolveThemeMode(container: HTMLElement, requested: ThemeMode = "auto"): Exclude<ThemeMode, "auto"> {
  if (requested !== "auto") return requested;
  if (container.closest(".slexkit-theme-uno, .slexkit-theme-flowbite")) return "uno";
  return hasThemeToken(container, "--primary") && hasThemeToken(container, "--background")
    ? "host-shadcn"
    : "uno";
}

function resolveColorMode(container: HTMLElement): "light" | "dark" | undefined {
  const scoped = container.closest<HTMLElement>(".dark, .light, [data-theme='dark'], [data-theme='light']");
  if (scoped?.classList.contains("dark") || scoped?.dataset.theme === "dark") return "dark";
  if (scoped?.classList.contains("light") || scoped?.dataset.theme === "light") return "light";

  const doc = container.ownerDocument || document;
  const docEl = doc.documentElement;
  if (docEl.classList.contains("dark") || docEl.dataset.theme === "dark") return "dark";
  if (docEl.classList.contains("light") || docEl.dataset.theme === "light") return "light";

  const scheme = getComputedStyle(docEl).colorScheme || getComputedStyle(container).colorScheme;
  if (scheme.split(/\s+/).includes("dark")) return "dark";
  if (scheme.split(/\s+/).includes("light")) return "light";
  return undefined;
}

function applyDocumentColorMode(doc: Document, mode: "light" | "dark" | undefined): void {
  if (!mode) return;
  doc.documentElement.classList.toggle("dark", mode === "dark");
  doc.documentElement.classList.toggle("light", mode === "light");
  doc.documentElement.dataset.theme = mode;
}

function resolveDirection(container: HTMLElement, requested: DirectionMode = "auto"): Exclude<DirectionMode, "auto"> {
  if (requested === "ltr" || requested === "rtl") return requested;
  const inherited = container.closest<HTMLElement>("[dir]")?.dir || container.ownerDocument?.documentElement?.dir;
  return inherited === "rtl" ? "rtl" : "ltr";
}

export function mount(input: SlexExpression | string, container: HTMLElement, options: MountOptions = {}): () => void {
  const expression = parseSourceOrExpression(input);
  if (!expression) return () => {};

  const ns = expression.namespace || "default";
  const store = getStore(ns);
  const ownerDocument = container.ownerDocument || document;
  applyExpression(expression);

  const oldCleanup = store.cleanups.get(container);
  if (oldCleanup) oldCleanup();

  const root = ownerDocument.createElement("div");
  const theme = resolveThemeMode(container, options.theme);
  const dir = resolveDirection(container, options.dir);
  root.className = `slexkit-root slexkit-theme-${theme}`;
  root.dir = dir;
  root.dataset.namespace = ns;
  root.dataset.theme = theme;
  root.dataset.dir = dir;
  container.appendChild(root);
  store.roots.set(container, root);

  const cleanup = createRoot((dispose) => {
    const layoutRoot = ownerDocument.createElement("div");
    layoutRoot.className = "slex-layout";
    root.appendChild(layoutRoot);
    renderTree(expression.layout ?? {}, layoutRoot, store.g, store.components, store.componentTypes, undefined, ns, options.api, {
      dir,
      labels: options.labels ?? {},
    });
    return () => {
      dispose();
      root.remove();
      store.roots.delete(container);
      store.cleanups.delete(container);
    };
  });
  store.cleanups.set(container, cleanup);

  return cleanup;
}

export function disposeNamespace(namespace: string): void {
  const ns = namespace || "default";
  const store = peekStore(ns);
  if (store) {
    for (const cleanup of Array.from(store.cleanups.values())) {
      try {
        cleanup();
      } catch (e) {
        console.warn(`[SlexKit][${ns}] Cleanup error while disposing namespace:`, (e as Error).message);
      }
    }
    for (const root of Array.from(store.roots.values())) {
      root.remove();
    }
    store.roots.clear();
    store.cleanups.clear();
    deleteStore(ns);
  }
  clearEvalCache(ns);
}

export function mountSecureArtifact(
  input: SlexExpression | string,
  container: HTMLElement,
  options: SecureMountOptions,
): () => void {
  container.dataset.slexkitSecureRuntime = "true";
  let frameTarget: { target?: HTMLElement; dispose: () => void; sandboxed?: boolean } | null;
  try {
    frameTarget = createSecureFrameTarget(input, container, options);
  } catch (error) {
    delete container.dataset.slexkitSecureRuntime;
    throw error;
  }
  if (frameTarget?.sandboxed) {
    return () => {
      frameTarget.dispose();
      delete container.dataset.slexkitSecureRuntime;
    };
  }
  if (!options.unsafeInlineExecution) {
    delete container.dataset.slexkitSecureRuntime;
    throw new Error("mountSecureArtifact requires a sandbox frame runtime URL. Use unsafeInlineExecution only for trusted inline execution.");
  }

  const runtime = createSecureRuntime(options.policy, options.hostAdapter);
  const target = frameTarget?.target ?? container;
  const cleanup = mount(input, target, {
    theme: options.theme,
    dir: options.dir,
    labels: options.labels,
    api: runtime.api as unknown as Record<string, unknown>,
  });
  return () => {
    cleanup();
    runtime.dispose();
    frameTarget?.dispose();
    delete container.dataset.slexkitSecureRuntime;
  };
}

function createSecureFrameTarget(
  input: SlexExpression | string,
  container: HTMLElement,
  mountOptions: SecureMountOptions,
): { target?: HTMLElement; dispose: () => void; sandboxed?: boolean } | null {
  const frame = mountOptions.frame;
  if (!frame) return null;

  const ownerDocument = container.ownerDocument || document;
  const options = typeof frame === "object" ? frame : {};
  const iframe = ownerDocument.createElement("iframe");
  iframe.className = options.className ?? "slexkit-secure-frame";
  iframe.title = options.title ?? "SlexKit secure artifact";
  iframe.setAttribute("data-slexkit-secure-frame", "true");
  iframe.setAttribute("referrerpolicy", "no-referrer");
  iframe.style.display = "block";
  iframe.style.width = "100%";
  iframe.style.border = "0";
  iframe.style.background = "transparent";
  const runtimeUrl = options.runtimeUrl ?? options.runnerUrl ?? defaultRuntimeUrl;
  if (runtimeUrl) {
    const resolvedRuntimeUrl = resolveRuntimeUrl(runtimeUrl);
    const styleUrl = options.styleUrl === false ? "" : (options.styleUrl ?? defaultSecureFrameStyleUrl(resolvedRuntimeUrl));
    const resolvedStyleUrl = styleUrl ? resolveRuntimeUrl(styleUrl) : undefined;
    assertSandboxCloneable(input);
    iframe.setAttribute("sandbox", secureSandboxAttribute(options));
    container.replaceChildren(iframe);
    const bridge = createSandboxBridge(input, container, iframe, mountOptions);
    iframe.srcdoc = secureRunnerSrcdoc(resolvedRuntimeUrl, resolvedStyleUrl);
    return bridge;
  }
  if (frame) {
    iframe.remove();
    throw new Error("SlexKit secure frame requires runtimeUrl or setSlexKitRuntimeUrl().");
  }
  if (options.sandbox) iframe.setAttribute("sandbox", options.sandbox);

  container.replaceChildren(iframe);

  const frameDocument = iframe.contentDocument;
  if (!frameDocument?.body) {
    iframe.remove();
    throw new Error("Unable to create SlexKit secure frame document.");
  }

  frameDocument.open();
  frameDocument.write("<!doctype html><html><head></head><body><div id=\"slexkit-secure-root\"></div></body></html>");
  frameDocument.close();
  applyDocumentColorMode(frameDocument, resolveColorMode(container));

  const target = frameDocument.getElementById("slexkit-secure-root") as HTMLElement | null;
  if (!target) {
    iframe.remove();
    throw new Error("Unable to create SlexKit secure frame root.");
  }

  return {
    target,
    dispose: () => iframe.remove(),
  };
}

function secureSandboxAttribute(options: { sandbox?: string; unsafeAllowSameOrigin?: boolean }): string {
  const sandbox = options.sandbox ?? "allow-scripts";
  const tokens = sandbox.split(/\s+/).filter(Boolean);
  if (tokens.includes("allow-same-origin") && !options.unsafeAllowSameOrigin) {
    throw new Error("SlexKit secure frames cannot use allow-same-origin unless unsafeAllowSameOrigin is explicitly enabled.");
  }
  if (!tokens.includes("allow-scripts")) {
    throw new Error("SlexKit secure frames require allow-scripts to run the runtime.");
  }
  return tokens.join(" ");
}

function resolveRuntimeUrl(runtimeUrl: string): string {
  try {
    const base = typeof document !== "undefined" ? document.baseURI : undefined;
    return new URL(runtimeUrl, base).href;
  } catch {
    return runtimeUrl;
  }
}

function cspSourceForRuntime(runtimeUrl: string): string {
  try {
    const parsed = new URL(runtimeUrl);
    if (parsed.protocol === "blob:") return "blob:";
    if (parsed.protocol === "data:") return "data:";
    return parsed.origin;
  } catch {
    return "'self'";
  }
}

function defaultSecureFrameStyleUrl(runtimeUrl: string): string {
  try {
    const url = new URL(runtimeUrl);
    if (url.protocol === "blob:" || url.protocol === "data:") return "";
    url.pathname = url.pathname.replace(/[^/]+$/, "slexkit.css");
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return "";
  }
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function secureRunnerSrcdoc(runtimeUrl: string, styleUrl?: string): string {
  const nonce = randomToken(12);
  const styleSource = styleUrl ? ` ${cspSourceForRuntime(styleUrl)}` : "";
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'unsafe-eval' ${cspSourceForRuntime(runtimeUrl)}`,
    "connect-src 'none'",
    "img-src data: blob:",
    `style-src 'unsafe-inline'${styleSource}`,
    "font-src data:",
    "form-action 'none'",
    "base-uri 'none'",
  ].join("; ");
  const style = "html,body{margin:0;min-height:100%;overflow:hidden;}#slexkit-secure-root{min-height:100%;}";
  const stylesheet = styleUrl ? `<link rel="stylesheet" href="${escapeHtmlAttribute(styleUrl)}">` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escapeHtmlAttribute(csp)}">${stylesheet}<style>${style}</style></head><body><div id="slexkit-secure-root"></div><script type="module" nonce="${nonce}">import { startSlexKitSandboxRunner } from ${JSON.stringify(runtimeUrl)}; startSlexKitSandboxRunner();</script></body></html>`;
}

function secureFrameLoadTimeout(options: SecureMountOptions): number {
  const frame = options.frame;
  if (frame && typeof frame === "object" && typeof frame.loadTimeoutMs === "number") {
    return Math.max(0, frame.loadTimeoutMs);
  }
  return 8000;
}

function secureFrameMaxUnresponsiveMs(options: SecureMountOptions): number {
  const value = options.policy.execution?.maxUnresponsiveMs;
  return typeof value === "number" ? Math.max(0, value) : 0;
}

function secureFrameLoadError(runtimeUrl: string, phase: "ready" | "mounted", detail?: string): Error {
  const phaseMessage = phase === "ready"
    ? "The sandbox did not report that the runtime module loaded."
    : "The sandbox loaded but did not confirm artifact mount.";
  const suffix = detail ? `\nSandbox error: ${detail}` : "";
  return new Error(
    `SlexKit secure runtime failed to load.\n${phaseMessage}\nRuntime URL: ${runtimeUrl}\n` +
      "Check that this URL serves slexkit.runtime.js as an ES module with:\n" +
      "Access-Control-Allow-Origin: *\nContent-Type: text/javascript\n" +
      "Do not fix this by adding allow-same-origin to the sandbox frame." +
      suffix,
  );
}

function secureFrameHeartbeatError(runtimeUrl: string, elapsedMs: number): Error {
  return new Error(
    "SlexKit secure runtime stopped responding.\n" +
      `No sandbox heartbeat was received for ${Math.round(elapsedMs)} ms.\n` +
      `Runtime URL: ${runtimeUrl}\n` +
      "The sandbox frame was terminated to avoid keeping unresponsive agent code alive.",
  );
}

function showSecureFrameError(container: HTMLElement, iframe: HTMLIFrameElement, error: Error): void {
  container.dataset.slexkitSecureStatus = "error";
  let alert = container.querySelector(".slexkit-secure-error") as HTMLElement | null;
  if (!alert) {
    alert = (container.ownerDocument || document).createElement("div");
    alert.className = "slexkit-secure-error";
    alert.setAttribute("role", "alert");
    iframe.after(alert);
  }
  alert.textContent = error.message;
  console.error(error.message);
}

function clearSecureFrameError(container: HTMLElement): void {
  delete container.dataset.slexkitSecureStatus;
  container.querySelector(".slexkit-secure-error")?.remove();
}

function assertSandboxCloneable(input: SlexExpression | string): void {
  if (typeof input === "string") return;
  const seen = new Set<unknown>();
  const visit = (value: unknown): void => {
    if (typeof value === "function") {
      throw new Error("Sandbox runner input cannot contain functions. Pass Slex source to execute functions inside the sandbox realm.");
    }
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    for (const item of Object.values(value as Record<string, unknown>)) visit(item);
  };
  visit(input);
}

function createSandboxBridge(
  input: SlexExpression | string,
  container: HTMLElement,
  iframe: HTMLIFrameElement,
  options: SecureMountOptions,
): { dispose: () => void; sandboxed: true } {
  const id = `secure_${randomToken(8)}`;
  const token = randomToken(24);
  const bridgeRuntime = createSecureRuntime(options.policy, options.hostAdapter);
  const runtimeUrl = typeof options.frame === "object"
    ? resolveRuntimeUrl(options.frame.runtimeUrl ?? options.frame.runnerUrl ?? defaultRuntimeUrl ?? "")
    : resolveRuntimeUrl(defaultRuntimeUrl ?? "");
  const loadTimeoutMs = secureFrameLoadTimeout(options);
  const artifactSlots = normalizeArtifactSlots(options.artifactSlots);
  let disposed = false;
  let mounted = false;
  let ready = false;
  let mountAcknowledged = false;
  let loadTimer: number | undefined;
  let heartbeatTimer: number | undefined;
  let slotSyncFrame: number | undefined;
  let slotSyncTimer: number | undefined;
  let lastHeartbeat = 0;
  const maxUnresponsiveMs = secureFrameMaxUnresponsiveMs(options);
  const ownerWindow = iframe.ownerDocument.defaultView ?? window;
  const slotStyleSnapshots = new Map<HTMLElement, {
    minHeight: string;
    position: string;
    secureSlotId: string | undefined;
  }>();
  let adjustedAnchorPosition = false;

  const clearLoadTimer = () => {
    if (loadTimer === undefined) return;
    window.clearTimeout(loadTimer);
    loadTimer = undefined;
  };

  const clearHeartbeatTimer = () => {
    if (heartbeatTimer === undefined) return;
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  };

  const failLoad = (phase: "ready" | "mounted", detail?: string) => {
    if (disposed || mountAcknowledged) return;
    clearLoadTimer();
    showSecureFrameError(container, iframe, secureFrameLoadError(runtimeUrl, phase, detail));
    terminateFrame({ keepDiagnostic: true });
  };

  const failHeartbeat = () => {
    if (disposed || !mountAcknowledged || maxUnresponsiveMs <= 0) return;
    const elapsed = Date.now() - lastHeartbeat;
    if (elapsed < maxUnresponsiveMs) return;
    clearHeartbeatTimer();
    showSecureFrameError(container, iframe, secureFrameHeartbeatError(runtimeUrl, elapsed));
    terminateFrame({ keepDiagnostic: true });
  };

  const startHeartbeatWatchdog = () => {
    if (maxUnresponsiveMs <= 0 || heartbeatTimer !== undefined) return;
    lastHeartbeat = Date.now();
    heartbeatTimer = window.setInterval(failHeartbeat, Math.max(10, Math.min(1000, maxUnresponsiveMs / 2)));
  };

  const clearSlotSyncTimer = () => {
    if (slotSyncFrame !== undefined) {
      ownerWindow.cancelAnimationFrame(slotSyncFrame);
      slotSyncFrame = undefined;
    }
    if (slotSyncTimer !== undefined) {
      ownerWindow.clearTimeout(slotSyncTimer);
      slotSyncTimer = undefined;
    }
  };

  const syncArtifactSlotsNow = () => {
    slotSyncFrame = undefined;
    slotSyncTimer = undefined;
    if (!artifactSlots.length || disposed) return;
    const frameRect = iframe.getBoundingClientRect();
    const slots = artifactSlots.map((slot) => {
      const rect = slot.container.getBoundingClientRect();
      return {
        id: slot.id,
        left: rect.left - frameRect.left,
        top: rect.top - frameRect.top,
        width: rect.width,
        height: rect.height,
      };
    });
    if (artifactSlots.length > 1) {
      const maxBottom = Math.max(1, ...slots.map((slot) => slot.top + slot.height));
      iframe.style.height = `${Math.ceil(maxBottom)}px`;
    }
    iframe.contentWindow?.postMessage({
      channel: "slexkit-secure",
      type: "slots",
      id,
      token,
      slots,
    }, "*");
  };

  const requestArtifactSlotSync = () => {
    if (!artifactSlots.length || disposed || slotSyncFrame !== undefined || slotSyncTimer !== undefined) return;
    if (typeof ownerWindow.requestAnimationFrame === "function") {
      slotSyncFrame = ownerWindow.requestAnimationFrame(syncArtifactSlotsNow);
    } else {
      slotSyncTimer = ownerWindow.setTimeout(syncArtifactSlotsNow, 0);
    }
  };

  const slotResizeObserver = artifactSlots.length && typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(requestArtifactSlotSync)
    : undefined;
  if (artifactSlots.length > 1) {
    slotStyleSnapshots.set(container, {
      minHeight: container.style.minHeight,
      position: container.style.position,
      secureSlotId: container.dataset.slexkitSecureArtifactSlotId,
    });
    iframe.style.position = "absolute";
    iframe.style.inset = "0 auto auto 0";
    iframe.style.width = "100%";
    iframe.style.minHeight = "1px";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.zIndex = "1";
    iframe.setAttribute("allowtransparency", "true");
    const computedAnchorPosition = ownerWindow.getComputedStyle(container).position;
    if (!computedAnchorPosition || computedAnchorPosition === "static") {
      container.style.position = "relative";
      adjustedAnchorPosition = true;
    }
  }
  for (const slot of artifactSlots) {
    if (!slotStyleSnapshots.has(slot.container)) {
      slotStyleSnapshots.set(slot.container, {
        minHeight: slot.container.style.minHeight,
        position: slot.container.style.position,
        secureSlotId: slot.container.dataset.slexkitSecureArtifactSlotId,
      });
    }
    slot.container.dataset.slexkitSecureArtifactSlotId = slot.id;
    slotResizeObserver?.observe(slot.container);
  }
  if (artifactSlots.length) {
    ownerWindow.addEventListener("resize", requestArtifactSlotSync);
    ownerWindow.addEventListener("scroll", requestArtifactSlotSync, true);
  }

  if (loadTimeoutMs > 0) {
    loadTimer = window.setTimeout(() => {
      failLoad(ready ? "mounted" : "ready");
    }, loadTimeoutMs);
  }

  const postMount = () => {
    if (mounted) return;
    mounted = true;
    iframe.contentWindow?.postMessage({
      channel: "slexkit-secure",
      type: "mount",
      id,
      token,
      input,
      policy: options.policy,
      theme: options.theme,
      colorMode: resolveColorMode(container),
      dir: options.dir,
      labels: options.labels,
    }, "*");
  };

  const onMessage = (event: MessageEvent) => {
    if (disposed || event.source !== iframe.contentWindow) return;
    const data = event.data as {
      channel?: unknown;
      type?: unknown;
      id?: unknown;
      requestId?: unknown;
      slotId?: unknown;
      token?: unknown;
      request?: unknown;
      height?: unknown;
    };
    if (!data || data.channel !== "slexkit-secure") return;
    if (data.type === "ready") {
      ready = true;
      postMount();
      return;
    }
    if (data.type === "mounted" && data.id === id && data.token === token) {
      mountAcknowledged = true;
      lastHeartbeat = Date.now();
      clearLoadTimer();
      clearSecureFrameError(container);
      startHeartbeatWatchdog();
      syncArtifactSlotsNow();
      return;
    }
    if (data.type === "heartbeat" && data.id === id && data.token === token) {
      lastHeartbeat = Date.now();
      return;
    }
    if (data.type === "slot-size" && data.id === id && data.token === token && typeof data.slotId === "string") {
      const slot = artifactSlots.find((item) => item.id === data.slotId);
      if (slot && typeof (data as { height?: unknown }).height === "number" && Number.isFinite((data as { height: number }).height)) {
        const height = Math.max(0, Math.ceil((data as { height: number }).height));
        slot.container.style.minHeight = `${height}px`;
        if (artifactSlots.length === 1) {
          iframe.style.height = `${Math.max(1, height)}px`;
        }
        requestArtifactSlotSync();
      }
      return;
    }
    if (data.type === "frame-size" && data.id === id && data.token === token) {
      if (artifactSlots.length <= 1 && typeof data.height === "number" && Number.isFinite(data.height)) {
        iframe.style.height = `${Math.max(1, Math.ceil(data.height))}px`;
      }
      return;
    }
    if (data.type === "error" && (!data.id || data.id === id) && (!data.token || data.token === token)) {
      const error = data as { error?: { message?: unknown } };
      failLoad(ready ? "mounted" : "ready", typeof error.error?.message === "string" ? error.error.message : undefined);
      return;
    }
    if (data.type !== "fetch" || data.id !== id || data.token !== token || typeof data.requestId !== "string") return;
    const request = validateSandboxFetchRequest(data.request);
    if (!request) return;

    void bridgeRuntime.api.fetch(request.url, request)
      .then((result) => {
        iframe.contentWindow?.postMessage({
          channel: "slexkit-secure",
          type: "fetch-result",
          id,
          token,
          requestId: data.requestId,
          result,
        }, "*");
      })
      .catch((error) => {
        iframe.contentWindow?.postMessage({
          channel: "slexkit-secure",
          type: "fetch-result",
          id,
          token,
          requestId: data.requestId,
          error: serializeRuntimeError(error),
        }, "*");
      });
  };

  window.addEventListener("message", onMessage);

  const terminateFrame = ({ keepDiagnostic = false }: { keepDiagnostic?: boolean } = {}) => {
    if (disposed) return;
    disposed = true;
    iframe.contentWindow?.postMessage({
      channel: "slexkit-secure",
      type: "dispose",
      id,
      token,
    }, "*");
    clearLoadTimer();
    clearHeartbeatTimer();
    clearSlotSyncTimer();
    slotResizeObserver?.disconnect();
    if (artifactSlots.length) {
      ownerWindow.removeEventListener("resize", requestArtifactSlotSync);
      ownerWindow.removeEventListener("scroll", requestArtifactSlotSync, true);
    }
    for (const slot of artifactSlots) {
      const snapshot = slotStyleSnapshots.get(slot.container);
      if (snapshot) {
        if (snapshot.secureSlotId === undefined) delete slot.container.dataset.slexkitSecureArtifactSlotId;
        else slot.container.dataset.slexkitSecureArtifactSlotId = snapshot.secureSlotId;
        slot.container.style.minHeight = snapshot.minHeight;
      } else {
        delete slot.container.dataset.slexkitSecureArtifactSlotId;
        slot.container.style.removeProperty("min-height");
      }
    }
    if (adjustedAnchorPosition) container.style.position = slotStyleSnapshots.get(container)?.position ?? "";
    window.removeEventListener("message", onMessage);
    bridgeRuntime.dispose();
    iframe.remove();
    if (!keepDiagnostic) clearSecureFrameError(container);
    if (!container.hasChildNodes()) container.replaceChildren();
  };

  return {
    sandboxed: true,
    dispose: () => terminateFrame(),
  };
}

function normalizeArtifactSlots(slots: SecureArtifactSlot[] | undefined): SecureArtifactSlot[] {
  if (!slots?.length) return [];
  const seen = new Set<string>();
  const normalized: SecureArtifactSlot[] = [];
  for (const slot of slots) {
    const id = String(slot.id || "").trim();
    if (!id || seen.has(id) || !slot.container) continue;
    seen.add(id);
    normalized.push({ id, container: slot.container });
  }
  return normalized;
}

function randomToken(bytes: number): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const values = new Uint8Array(bytes);
    cryptoApi.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function validateSandboxFetchRequest(value: unknown): HostFetchRequest | null {
  if (!value || typeof value !== "object") return null;
  const request = value as Record<string, unknown>;
  if (typeof request.url !== "string") return null;
  if (request.method !== "GET" && request.method !== "POST") return null;
  if (request.credentials !== "omit" && request.credentials !== "same-origin" && request.credentials !== "include") return null;
  if (typeof request.timeoutMs !== "number" || !Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0) return null;
  if (request.headers !== undefined && !isStringRecord(request.headers)) return null;
  return {
    url: request.url,
    method: request.method,
    headers: request.headers as Record<string, string> | undefined,
    body: request.body,
    credentials: request.credentials,
    timeoutMs: request.timeoutMs,
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((item) => typeof item === "string");
}

export function ingest(input: SlexExpression | string): boolean {
  const expression = parseSourceOrExpression(input);
  if (!expression) return false;
  applyExpression(expression);
  return true;
}

export type BootOptions = {
  selector?: string;
  sourceControls?: boolean;
  theme?: ThemeMode;
  dir?: MountOptions["dir"];
  labels?: MountOptions["labels"];
};

function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function mountBootPreview(source: string, host: HTMLElement, options: MountOptions): () => void {
  host.replaceChildren();
  const preview = document.createElement("div");
  preview.className = "slexkit-preview";
  host.appendChild(preview);
  return mount(source, preview, options);
}

function addSourceControls(pre: HTMLPreElement, host: HTMLElement, remount: () => void): void {
  const toolbar = document.createElement("div");
  toolbar.className = "slexkit-source-toolbar";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "slexkit-source-button";
  copyButton.textContent = "Copy source";
  copyButton.addEventListener("click", () => copyText(pre.textContent || ""));

  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.className = "slexkit-source-button";
  viewButton.textContent = "Hide source";
  viewButton.addEventListener("click", () => {
    pre.hidden = !pre.hidden;
    viewButton.textContent = pre.hidden ? "View source" : "Hide source";
  });

  const renderButton = document.createElement("button");
  renderButton.type = "button";
  renderButton.className = "slexkit-source-button";
  renderButton.textContent = "Re-render";
  renderButton.addEventListener("click", remount);

  toolbar.append(copyButton, viewButton, renderButton);
  host.parentNode?.insertBefore(toolbar, host);
}

export function boot(options: BootOptions = {}): void {
  const selector = options.selector || "pre code.language-slex";
  document.querySelectorAll(selector).forEach((el) => {
    if ((el as HTMLElement).dataset.slexkitBooted === "true") return;
    (el as HTMLElement).dataset.slexkitBooted = "true";

    const source = el.textContent || "";
    const pre = el.closest("pre");
    const host = document.createElement("div");
    host.className = "slexkit-card";

    if (pre) pre.parentNode!.insertBefore(host, pre.nextSibling);
    else el.parentNode!.insertBefore(host, el.nextSibling);

    let cleanup = mountBootPreview(source, host, { theme: options.theme, dir: options.dir, labels: options.labels });
    const remount = () => {
      cleanup();
      cleanup = mountBootPreview(el.textContent || "", host, { theme: options.theme, dir: options.dir, labels: options.labels });
    };

    if (pre && options.sourceControls !== false) {
      addSourceControls(pre, host, remount);
    }
  });
}
