import { mount } from "./index";
import {
  createSecureRuntime,
  deserializeRuntimeError,
  SlexKitRuntimeError,
  serializeRuntimeError,
  type HostFetchRequest,
  type HostRuntimeAdapter,
  type HostRuntimePolicy,
  type NetworkResult,
  type RuntimeCanvasContextId,
  type SandboxFetchResponseMessage,
  type SandboxHostMessage,
  type SandboxMountMessage,
  type SandboxSlotsMessage,
} from "./secure-runtime";
import type { SlexExpression, ThemeMode } from "./types";

type PendingFetch = {
  resolve: (result: NetworkResult) => void;
  reject: (error: unknown) => void;
};

type SchedulingGlobalSnapshot = {
  setTimeout?: typeof globalThis.setTimeout;
  clearTimeout?: typeof globalThis.clearTimeout;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
  requestAnimationFrame?: typeof globalThis.requestAnimationFrame;
  cancelAnimationFrame?: typeof globalThis.cancelAnimationFrame;
};

const schedulingSnapshot: SchedulingGlobalSnapshot = {
  setTimeout: typeof globalThis.setTimeout === "function" ? globalThis.setTimeout.bind(globalThis) : undefined,
  clearTimeout: typeof globalThis.clearTimeout === "function" ? globalThis.clearTimeout.bind(globalThis) : undefined,
  setInterval: typeof globalThis.setInterval === "function" ? globalThis.setInterval.bind(globalThis) : undefined,
  clearInterval: typeof globalThis.clearInterval === "function" ? globalThis.clearInterval.bind(globalThis) : undefined,
  requestAnimationFrame: typeof globalThis.requestAnimationFrame === "function" ? globalThis.requestAnimationFrame.bind(globalThis) : undefined,
  cancelAnimationFrame: typeof globalThis.cancelAnimationFrame === "function" ? globalThis.cancelAnimationFrame.bind(globalThis) : undefined,
};

function isHostMessage(value: unknown): value is SandboxHostMessage {
  return !!value &&
    typeof value === "object" &&
    (value as { channel?: unknown }).channel === "slexkit-secure" &&
    typeof (value as { type?: unknown }).type === "string";
}

function frameRoot(): HTMLElement {
  let root = document.getElementById("slexkit-secure-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "slexkit-secure-root";
    document.body.appendChild(root);
  }
  return root;
}

function applyColorMode(mode: SandboxMountMessage["colorMode"]): void {
  if (mode !== "dark" && mode !== "light") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.classList.toggle("light", mode === "light");
  document.documentElement.dataset.theme = mode;
}

function post(message: unknown): void {
  window.parent?.postMessage(message, "*");
}

function createBridgeAdapter(id: string, token: string, pending: Map<string, PendingFetch>): HostRuntimeAdapter {
  let nextRequest = 1;
  return {
    fetch(request: HostFetchRequest) {
      const requestId = `${Date.now()}_${nextRequest++}`;
      post({
        channel: "slexkit-secure",
        type: "fetch",
        id,
        token,
        requestId,
        request,
      });
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
      });
    },
    setTimeout(fn, ms) {
      if (!schedulingSnapshot.setTimeout) {
        throw new SlexKitRuntimeError("policy", "timer_unavailable", "Native timer host is unavailable.");
      }
      return schedulingSnapshot.setTimeout(fn, ms) as unknown as number;
    },
    clearTimeout(id) {
      schedulingSnapshot.clearTimeout?.(id as unknown as ReturnType<typeof globalThis.setTimeout>);
    },
    setInterval(fn, ms) {
      if (!schedulingSnapshot.setInterval) {
        throw new SlexKitRuntimeError("policy", "timer_unavailable", "Native interval host is unavailable.");
      }
      return schedulingSnapshot.setInterval(fn, ms) as unknown as number;
    },
    clearInterval(id) {
      schedulingSnapshot.clearInterval?.(id as unknown as ReturnType<typeof globalThis.setInterval>);
    },
    requestAnimationFrame(fn) {
      if (!schedulingSnapshot.requestAnimationFrame) {
        throw new SlexKitRuntimeError("policy", "animation_unavailable", "Native animation frame host is unavailable.");
      }
      return schedulingSnapshot.requestAnimationFrame(fn);
    },
    cancelAnimationFrame(id) {
      schedulingSnapshot.cancelAnimationFrame?.(id);
    },
  };
}

function blockedNetworkError(): Error {
  return new Error("Native network APIs are disabled inside the SlexKit sandbox. Use api.get(), api.post(), or api.fetch().");
}

function defineBlockedGlobal(name: string, value: unknown): void {
  try {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
    });
  } catch {
    // Some browser globals are not configurable. CSP still blocks their network access.
  }
}

function hardenNetworkGlobals(): void {
  defineBlockedGlobal("fetch", () => Promise.reject(blockedNetworkError()));
  defineBlockedGlobal("XMLHttpRequest", class {
    constructor() {
      throw blockedNetworkError();
    }
  });
  defineBlockedGlobal("WebSocket", class {
    constructor() {
      throw blockedNetworkError();
    }
  });
  defineBlockedGlobal("EventSource", class {
    constructor() {
      throw blockedNetworkError();
    }
  });
  defineBlockedGlobal("Worker", class {
    constructor() {
      throw blockedNetworkError();
    }
  });
  defineBlockedGlobal("SharedWorker", class {
    constructor() {
      throw blockedNetworkError();
    }
  });
  try {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: () => false,
    });
  } catch {
    // Ignore readonly navigator implementations.
  }
}

function blockedSchedulingError(name: string): SlexKitRuntimeError {
  return new SlexKitRuntimeError("policy", "native_scheduling_disabled", `Native ${name} is disabled inside the SlexKit sandbox. Use api.${name}().`);
}

export function hardenSchedulingGlobals(): void {
  defineBlockedGlobal("setTimeout", () => {
    throw blockedSchedulingError("setTimeout");
  });
  defineBlockedGlobal("setInterval", () => {
    throw blockedSchedulingError("setInterval");
  });
  defineBlockedGlobal("requestAnimationFrame", () => {
    throw blockedSchedulingError("raf");
  });
  defineBlockedGlobal("clearTimeout", () => undefined);
  defineBlockedGlobal("clearInterval", () => undefined);
  defineBlockedGlobal("cancelAnimationFrame", () => undefined);
}

type CanvasGlobalSnapshot = {
  getContext?: HTMLCanvasElement["getContext"];
  offscreenCanvas?: typeof OffscreenCanvas;
};

const canvasSnapshot: CanvasGlobalSnapshot = {
  getContext: typeof HTMLCanvasElement !== "undefined" ? HTMLCanvasElement.prototype.getContext : undefined,
  offscreenCanvas: typeof OffscreenCanvas !== "undefined" ? OffscreenCanvas : undefined,
};

function canvasPolicyError(code: string, message: string): SlexKitRuntimeError {
  return new SlexKitRuntimeError("policy", code, message);
}

function assertSandboxCanvasPolicy(
  policy: NonNullable<HostRuntimePolicy["canvas"]>,
  width: number,
  height: number,
  contextId?: string,
): void {
  if (!policy.enabled) {
    throw canvasPolicyError("canvas_disabled", "Canvas access is disabled.");
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw canvasPolicyError("canvas_size_invalid", "Canvas size must be positive finite numbers.");
  }
  const pixels = Math.ceil(width) * Math.ceil(height);
  if (policy.maxPixels !== undefined && pixels > policy.maxPixels) {
    throw canvasPolicyError("canvas_too_large", "Canvas size exceeds the runtime policy limit.");
  }
  if (contextId && policy.allowedContexts?.length && !policy.allowedContexts.includes(contextId as RuntimeCanvasContextId)) {
    throw canvasPolicyError("canvas_context_blocked", `Canvas context ${contextId} is not allowed.`);
  }
}

function hardenCanvasGlobals(policy: HostRuntimePolicy): void {
  if (typeof HTMLCanvasElement !== "undefined" && canvasSnapshot.getContext) {
    const contextCanvases = new WeakSet<HTMLCanvasElement>();
    let contextCanvasCount = 0;
    const canvasPolicy = policy.canvas;
    HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement, contextId: string, options?: unknown) {
      if (!canvasPolicy?.enabled) {
        throw canvasPolicyError("canvas_disabled", "Canvas access is disabled.");
      }
      assertSandboxCanvasPolicy(canvasPolicy, this.width, this.height, contextId);
      if (!contextCanvases.has(this)) {
        if (canvasPolicy.maxCanvases !== undefined && contextCanvasCount >= canvasPolicy.maxCanvases) {
          throw canvasPolicyError("canvas_limit", "Canvas limit exceeded.");
        }
        contextCanvases.add(this);
        contextCanvasCount += 1;
      }
      return canvasSnapshot.getContext!.call(this, contextId as "2d", options as CanvasRenderingContext2DSettings);
    } as HTMLCanvasElement["getContext"];
  }

  if (canvasSnapshot.offscreenCanvas) {
    const OriginalOffscreenCanvas = canvasSnapshot.offscreenCanvas;
    defineBlockedGlobal("OffscreenCanvas", class extends OriginalOffscreenCanvas {
      constructor(width: number, height: number) {
        const canvasPolicy = policy.canvas;
        if (!canvasPolicy?.enabled) {
          throw canvasPolicyError("canvas_disabled", "Canvas access is disabled.");
        }
        assertSandboxCanvasPolicy(canvasPolicy, width, height);
        super(width, height);
      }
    });
  }
}

export function startSlexKitSandboxRunner(): void {
  hardenNetworkGlobals();
  hardenSchedulingGlobals();
  const pendingFetches = new Map<string, PendingFetch>();
  let cleanup: (() => void) | undefined;
  let runtimeDispose: (() => void) | undefined;
  let activeId: string | undefined;
  let activeToken: string | undefined;
  let heartbeatTimer: ReturnType<typeof globalThis.setInterval> | undefined;
  let slotResizeObserver: ResizeObserver | undefined;

  function clearHeartbeat(): void {
    if (heartbeatTimer === undefined) return;
    schedulingSnapshot.clearInterval?.(heartbeatTimer);
    heartbeatTimer = undefined;
  }

  function startHeartbeat(policy: HostRuntimePolicy, id: string, token: string): void {
    clearHeartbeat();
    const intervalMs = Math.max(100, policy.execution?.heartbeatIntervalMs ?? 1000);
    if (!schedulingSnapshot.setInterval) return;
    heartbeatTimer = schedulingSnapshot.setInterval(() => {
      post({
        channel: "slexkit-secure",
        type: "heartbeat",
        id,
        token,
      });
    }, intervalMs);
  }

  function dispose(id?: string): void {
    if (id && activeId && id !== activeId) return;
    clearHeartbeat();
    slotResizeObserver?.disconnect();
    slotResizeObserver = undefined;
    cleanup?.();
    runtimeDispose?.();
    for (const pending of pendingFetches.values()) {
      pending.reject(new Error("SlexKit sandbox runtime was disposed."));
    }
    pendingFetches.clear();
    cleanup = undefined;
    runtimeDispose = undefined;
    activeId = undefined;
    activeToken = undefined;
    const root = frameRoot();
    root.style.removeProperty("position");
    root.style.removeProperty("min-height");
    root.replaceChildren();
  }

  function slotElement(slotId: string): HTMLElement | null {
    return document.getElementById(`slexkit-slot-${slotId}`);
  }

  function reportSlotSize(slotId: string, element: HTMLElement): void {
    if (!activeId || !activeToken) return;
    const height = Math.max(element.scrollHeight, element.getBoundingClientRect().height);
    post({
      channel: "slexkit-secure",
      type: "slot-size",
      id: activeId,
      token: activeToken,
      slotId,
      height,
    });
  }

  function applySlotRects(slots: SandboxSlotsMessage["slots"]): void {
    const root = frameRoot();
    const multiSlot = slots.length > 1;
    if (multiSlot) {
      const maxBottom = Math.max(1, ...slots.map((slot) => slot.top + slot.height));
      root.style.position = "relative";
      root.style.minHeight = `${Math.ceil(maxBottom)}px`;
    } else {
      root.style.removeProperty("position");
      root.style.removeProperty("min-height");
    }
    slotResizeObserver?.disconnect();
    slotResizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => {
          for (const entry of entries) {
            const element = entry.target as HTMLElement;
            const slotId = element.dataset.slexkitSlotId;
            if (slotId) reportSlotSize(slotId, element);
          }
        })
      : undefined;

    for (const slot of slots) {
      const element = slotElement(slot.id);
      if (!element) continue;
      element.dataset.slexkitSlotId = slot.id;
      element.style.boxSizing = "border-box";
      if (multiSlot) {
        element.style.position = "absolute";
        element.style.left = `${slot.left}px`;
        element.style.top = `${slot.top}px`;
      } else {
        element.style.removeProperty("position");
        element.style.removeProperty("left");
        element.style.removeProperty("top");
      }
      if (slot.width > 0) element.style.width = `${slot.width}px`;
      slotResizeObserver?.observe(element);
      reportSlotSize(slot.id, element);
    }
  }

  async function mountArtifact(message: SandboxMountMessage): Promise<void> {
    dispose();
    activeId = message.id;
    activeToken = message.token;
    hardenCanvasGlobals(message.policy);
    applyColorMode(message.colorMode);
    const runtime = createSecureRuntime(
      message.policy,
      createBridgeAdapter(message.id, message.token, pendingFetches),
    );
    runtimeDispose = runtime.dispose;
    cleanup = mount(message.input as SlexExpression | string, frameRoot(), {
      theme: message.theme as ThemeMode | undefined,
      dir: message.dir,
      labels: message.labels,
      api: runtime.api as unknown as Record<string, unknown>,
    });
    startHeartbeat(message.policy, message.id, message.token);
    post({
      channel: "slexkit-secure",
      type: "mounted",
      id: message.id,
      token: message.token,
    });
  }

  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window.parent || !isHostMessage(event.data)) return;
    const message = event.data;
    try {
      if (message.type === "mount") {
        void mountArtifact(message).catch((error) => {
          post({
            channel: "slexkit-secure",
            type: "error",
            id: message.id,
            token: message.token,
            error: serializeRuntimeError(error),
          });
        });
      } else if (message.type === "dispose") {
        if (activeToken && message.token !== activeToken) return;
        dispose(message.id);
        post({
          channel: "slexkit-secure",
          type: "disposed",
          id: message.id,
          token: message.token,
        });
      } else if (message.type === "fetch-result") {
        const response = message as SandboxFetchResponseMessage;
        if (activeToken && response.token !== activeToken) return;
        const pending = pendingFetches.get(response.requestId);
        if (!pending) return;
        pendingFetches.delete(response.requestId);
        if (response.error) pending.reject(deserializeRuntimeError(response.error));
        else pending.resolve(response.result as NetworkResult);
      } else if (message.type === "slots") {
        if (activeToken && message.token !== activeToken) return;
        applySlotRects((message as SandboxSlotsMessage).slots);
      }
    } catch (error) {
      post({
        channel: "slexkit-secure",
        type: "error",
        id: "id" in message ? message.id : undefined,
        token: activeToken,
        error: serializeRuntimeError(error),
      });
    }
  });

  post({
    channel: "slexkit-secure",
    type: "ready",
  });
}
