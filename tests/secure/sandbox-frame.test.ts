import { describe, expect, it, mock } from "bun:test";
import {
  createSecureRuntime,
  createSlexKitMarkdownRuntimeHost,
  getSlexKitRuntimeUrl,
  getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost,
  mount,
  mountSecureArtifact,
  setSlexKitRuntimeUrl,
  type HostRuntimePolicy,
} from "../../src/index";
import { hardenSchedulingGlobals } from "../../src/engine/sandbox-runner";

const closedPolicy: HostRuntimePolicy = {};

const policy: HostRuntimePolicy = {
  network: {
    enabled: true,
    methods: ["GET", "POST"],
    allowOrigins: ["https://example.com"],
    credentials: "omit",
    timeoutMs: 15000,
    maxBodyBytes: 1024,
  },
  timer: {
    enabled: true,
    maxTimers: 2,
    minIntervalMs: 10,
  },
  animation: {
    enabled: true,
  },
};

function setup() {
  document.body.innerHTML = '<div id="app"></div>';
  return document.getElementById("app")!;
}

function domRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function expectPolicyError(runtime: ReturnType<typeof createSecureRuntime>, promise: Promise<unknown>) {
  try {
    await promise;
    throw new Error("Expected policy error.");
  } catch (error) {
    expect(runtime.api.isPolicyError(error)).toBe(true);
  }
}

describe("secure sandbox frame", () => {

    it("blocks native scheduling globals inside the sandbox runner", () => {
      const original = {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
        setInterval: globalThis.setInterval,
        clearInterval: globalThis.clearInterval,
        requestAnimationFrame: globalThis.requestAnimationFrame,
        cancelAnimationFrame: globalThis.cancelAnimationFrame,
      };

      try {
        hardenSchedulingGlobals();
        expect(() => globalThis.setTimeout(() => {}, 10)).toThrow("Use api.setTimeout()");
        expect(() => globalThis.setInterval(() => {}, 10)).toThrow("Use api.setInterval()");
        expect(() => globalThis.requestAnimationFrame(() => {})).toThrow("Use api.raf()");
        expect(globalThis.clearTimeout(1 as unknown as ReturnType<typeof setTimeout>)).toBeUndefined();
        expect(globalThis.clearInterval(1 as unknown as ReturnType<typeof setInterval>)).toBeUndefined();
      } finally {
        Object.defineProperty(globalThis, "setTimeout", { configurable: true, value: original.setTimeout });
        Object.defineProperty(globalThis, "clearTimeout", { configurable: true, value: original.clearTimeout });
        Object.defineProperty(globalThis, "setInterval", { configurable: true, value: original.setInterval });
        Object.defineProperty(globalThis, "clearInterval", { configurable: true, value: original.clearInterval });
        Object.defineProperty(globalThis, "requestAnimationFrame", { configurable: true, value: original.requestAnimationFrame });
        Object.defineProperty(globalThis, "cancelAnimationFrame", { configurable: true, value: original.cancelAnimationFrame });
      }
    });


    it("uses the registered runtime module as the sandbox runner for frame mounts", () => {
      const container = setup();
      setSlexKitRuntimeUrl("/dist/slexkit.runtime.js");
      const cleanup = mountSecureArtifact({
        namespace: `secure_frame_${Date.now()}`,
        g: { value: "inside-frame" },
        layout: {
          "text:value": {
            $text: "g.value",
          },
        },
      }, container, {
        policy,
        frame: true,
      });

      const iframe = container.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(getSlexKitRuntimeUrl()).toBe("/dist/slexkit.runtime.js");
      expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
      expect(iframe.getAttribute("referrerpolicy")).toBe("no-referrer");
      expect(iframe.style.display).toBe("block");
      expect(iframe.style.width).toBe("100%");
      expect(iframe.style.border).toBe("0px");
      expect(iframe.style.background).toBe("transparent");
      expect(iframe.srcdoc).toContain("Content-Security-Policy");
      expect(iframe.srcdoc).toContain("'unsafe-eval'");
      expect(iframe.srcdoc).toContain("connect-src 'none'");
      expect(iframe.srcdoc).toContain("startSlexKitSandboxRunner");
      expect(iframe.srcdoc).toContain("/dist/slexkit.runtime.js");
      expect(iframe.srcdoc).toContain('rel="stylesheet"');
      expect(iframe.srcdoc).toContain("/dist/slexkit.css");
      expect(container.querySelector(".slexkit-root")).toBeNull();

      cleanup();
      expect(container.querySelector("iframe")).toBeNull();
      expect(container.dataset.slexkitSecureRuntime).toBeUndefined();
    });


    it("passes the host dark color mode to sandbox frame mounts", () => {
      document.body.innerHTML = '<div class="dark"><div id="app"></div></div>';
      const container = document.getElementById("app")!;
      const cleanup = mountSecureArtifact("({ namespace: 'dark_frame', layout: {} })", container, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          loadTimeoutMs: 0,
        },
      });

      try {
        const iframe = container.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
        expect(iframe).toBeTruthy();
        const posted: unknown[] = [];
        Object.defineProperty(iframe.contentWindow, "postMessage", {
          configurable: true,
          value: (message: unknown) => posted.push(message),
        });
        const readyEvent = new window.MessageEvent("message", {
          data: { channel: "slexkit-secure", type: "ready" },
        });
        Object.defineProperty(readyEvent, "source", {
          configurable: true,
          value: iframe.contentWindow,
        });
        window.dispatchEvent(readyEvent);

        const mountMessage = posted.find((message) =>
          !!message && typeof message === "object" && (message as { type?: unknown }).type === "mount"
        ) as { colorMode?: string };
        expect(mountMessage.colorMode).toBe("dark");
      } finally {
        cleanup();
      }
    });


    it("does not allow secure artifact mounts to silently execute inline", () => {
      const container = setup();
      expect(() => mountSecureArtifact("({ namespace: 'inline_blocked', layout: {} })", container, {
        policy,
      })).toThrow("unsafeInlineExecution");
      expect(container.dataset.slexkitSecureRuntime).toBeUndefined();
    });


    it("requires a runtime URL for secure frame mounts", () => {
      const previous = getSlexKitRuntimeUrl();
      setSlexKitRuntimeUrl(undefined);
      const container = setup();
      expect(() => mountSecureArtifact("({ namespace: 'missing_runtime', layout: {} })", container, {
        policy,
        frame: true,
      })).toThrow("runtimeUrl");
      setSlexKitRuntimeUrl(previous);
    });


    it("can create a sandbox runner frame without executing Slex source in the host realm", () => {
      const container = setup();
      const cleanup = mountSecureArtifact(`({
        namespace: "runner_frame",
        g: { value: "runner" },
        layout: { "text:value": { $text: "g.value" } },
      })`, container, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
        },
      });

      const iframe = container.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
      expect(iframe.srcdoc).toContain("connect-src 'none'");
      expect(iframe.srcdoc).toContain("startSlexKitSandboxRunner");
      expect(iframe.srcdoc).toContain("/dist/slexkit.runtime.js");
      expect(iframe.srcdoc).toContain("/dist/slexkit.css");
      expect(container.querySelector(".slexkit-root")).toBeNull();

      const posted: unknown[] = [];
      Object.defineProperty(iframe.contentWindow, "postMessage", {
        configurable: true,
        value: (message: unknown) => posted.push(message),
      });
      const readyEvent = new window.MessageEvent("message", {
        data: { channel: "slexkit-secure", type: "ready" },
      });
      Object.defineProperty(readyEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(readyEvent);
      const mountMessage = posted.find((message) =>
        !!message && typeof message === "object" && (message as { type?: unknown }).type === "mount"
      ) as { id: string; token: string };
      const sizeEvent = new window.MessageEvent("message", {
        data: {
          channel: "slexkit-secure",
          type: "frame-size",
          id: mountMessage.id,
          token: mountMessage.token,
          height: 640.2,
        },
      });
      Object.defineProperty(sizeEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(sizeEvent);
      expect(iframe.style.height).toBe("641px");

      cleanup();
      expect(container.querySelector("iframe")).toBeNull();
    });


    it("allows sandbox runner frame stylesheet injection to be disabled", () => {
      const container = setup();
      const cleanup = mountSecureArtifact("({ namespace: 'unstyled_runner_frame', layout: {} })", container, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          styleUrl: false,
        },
      });

      const iframe = container.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(iframe.srcdoc).toContain("/dist/slexkit.runtime.js");
      expect(iframe.srcdoc).not.toContain('rel="stylesheet"');
      expect(iframe.srcdoc).not.toContain("slexkit.css");

      cleanup();
    });


    it("sizes a single secure artifact slot to the sandbox content height", () => {
      document.body.innerHTML = '<div id="anchor"></div><div id="slot"></div>';
      const anchor = document.getElementById("anchor")!;
      const slot = document.getElementById("slot")!;
      const cleanup = mountSecureArtifact("({ namespace: 'single_slot_frame', layout: {} })", anchor, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
        },
        artifactSlots: [{ id: "slot_0", container: slot }],
      });

      const iframe = anchor.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      const posted: unknown[] = [];
      Object.defineProperty(iframe.contentWindow, "postMessage", {
        configurable: true,
        value: (message: unknown) => posted.push(message),
      });
      const readyEvent = new window.MessageEvent("message", {
        data: { channel: "slexkit-secure", type: "ready" },
      });
      Object.defineProperty(readyEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(readyEvent);
      const mountMessage = posted.find((message) =>
        !!message && typeof message === "object" && (message as { type?: unknown }).type === "mount"
      ) as { id: string; token: string };
      const sizeEvent = new window.MessageEvent("message", {
        data: {
          channel: "slexkit-secure",
          type: "slot-size",
          id: mountMessage.id,
          token: mountMessage.token,
          slotId: "slot_0",
          height: 572.4,
        },
      });
      Object.defineProperty(sizeEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(sizeEvent);

      expect(slot.style.minHeight).toBe("573px");
      expect(iframe.style.height).toBe("573px");

      cleanup();
    });


    it("shows an actionable diagnostic when the sandbox runtime does not load", async () => {
      const container = setup();
      const error = mock(() => {});
      const originalError = console.error;
      console.error = error;

      const cleanup = mountSecureArtifact("({ namespace: 'timeout_frame', layout: {} })", container, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          loadTimeoutMs: 1,
        },
      });

      try {
        await new Promise((resolve) => setTimeout(resolve, 5));

        const alert = container.querySelector(".slexkit-secure-error");
        expect(alert?.getAttribute("role")).toBe("alert");
        expect(alert?.textContent).toContain("SlexKit secure runtime failed to load");
        expect(alert?.textContent).toContain("Access-Control-Allow-Origin: *");
        expect(alert?.textContent).toContain("Content-Type: text/javascript");
        expect(container.dataset.slexkitSecureStatus).toBe("error");
        expect(container.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeNull();
        expect(error).toHaveBeenCalled();
      } finally {
        cleanup();
        console.error = originalError;
      }
    });


    it("terminates a mounted secure frame when sandbox heartbeats stop", async () => {
      const container = setup();
      const error = mock(() => {});
      const originalError = console.error;
      console.error = error;

      const cleanup = mountSecureArtifact("({ namespace: 'heartbeat_frame', layout: {} })", container, {
        policy: {
          ...policy,
          execution: {
            heartbeatIntervalMs: 10,
            maxUnresponsiveMs: 15,
          },
        },
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          loadTimeoutMs: 0,
        },
      });

      try {
        const iframe = container.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
        expect(iframe).toBeTruthy();
        const posted: unknown[] = [];
        Object.defineProperty(iframe.contentWindow, "postMessage", {
          configurable: true,
          value: (message: unknown) => posted.push(message),
        });
        const readyEvent = new window.MessageEvent("message", {
          data: { channel: "slexkit-secure", type: "ready" },
        });
        Object.defineProperty(readyEvent, "source", {
          configurable: true,
          value: iframe.contentWindow,
        });
        window.dispatchEvent(readyEvent);

        const mountMessage = posted.find((message) =>
          !!message && typeof message === "object" && (message as { type?: unknown }).type === "mount"
        ) as { id: string; token: string };
        expect(mountMessage).toBeTruthy();
        const acknowledged = new window.MessageEvent("message", {
          data: {
            channel: "slexkit-secure",
            type: "mounted",
            id: mountMessage?.id,
            token: mountMessage?.token,
          },
        });
        Object.defineProperty(acknowledged, "source", {
          configurable: true,
          value: iframe.contentWindow,
        });
        window.dispatchEvent(acknowledged);

        await new Promise((resolve) => setTimeout(resolve, 80));

        const alert = container.querySelector(".slexkit-secure-error");
        expect(alert?.textContent).toContain("stopped responding");
        expect(container.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeNull();
        expect(error).toHaveBeenCalled();
      } finally {
        cleanup();
        console.error = originalError;
      }
    });


    it("rejects unsafe same-origin secure frame sandboxes by default", () => {
      const container = setup();
      expect(() => mountSecureArtifact("({ namespace: 'unsafe_frame', layout: {} })", container, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          sandbox: "allow-scripts allow-same-origin",
        },
      })).toThrow("allow-same-origin");
    });


    it("bridges sandbox runner fetch requests through the host policy runtime", async () => {
      const container = setup();
      const posted: unknown[] = [];
      let fetchedUrl = "";
      const cleanup = mountSecureArtifact("({ namespace: 'bridge', g: {}, layout: {} })", container, {
        policy,
        hostAdapter: {
          fetch: async (request) => {
            fetchedUrl = request.url;
            return {
              ok: true,
              status: 200,
              statusText: "OK",
              url: request.url,
              headers: {},
              data: { bridged: true },
              elapsedMs: 1,
            };
          },
        },
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
        },
      });

      const iframe = container.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      Object.defineProperty(iframe.contentWindow, "postMessage", {
        configurable: true,
        value: (message: unknown) => posted.push(message),
      });

      const readyEvent = new window.MessageEvent("message", {
        data: { channel: "slexkit-secure", type: "ready" },
      });
      Object.defineProperty(readyEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(readyEvent);
      const mountMessage = posted.find((message) =>
        !!message && typeof message === "object" && (message as { type?: unknown }).type === "mount"
      ) as { id: string; token: string };
      expect(mountMessage?.id).toBeTruthy();
      expect(mountMessage?.token).toBeTruthy();

      const fetchEvent = new window.MessageEvent("message", {
        data: {
          channel: "slexkit-secure",
          type: "fetch",
          id: mountMessage.id,
          token: mountMessage.token,
          requestId: "req1",
          request: {
            method: "GET",
            url: "https://example.com/bridge",
            credentials: "omit",
            timeoutMs: 1000,
          },
        },
      });
      Object.defineProperty(fetchEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(fetchEvent);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetchedUrl).toBe("https://example.com/bridge");
      const response = posted.find((message) =>
        !!message && typeof message === "object" && (message as { type?: unknown; requestId?: unknown }).type === "fetch-result" && (message as { requestId?: unknown }).requestId === "req1"
      ) as { result?: { data?: unknown } };
      expect(response?.result?.data).toEqual({ bridged: true });

      cleanup();
    });


    it("ignores sandbox fetch requests with the wrong bridge token", async () => {
      const container = setup();
      const posted: unknown[] = [];
      let fetched = 0;
      const cleanup = mountSecureArtifact("({ namespace: 'bridge_token', g: {}, layout: {} })", container, {
        policy,
        hostAdapter: {
          fetch: async (request) => {
            fetched += 1;
            return {
              ok: true,
              status: 200,
              statusText: "OK",
              url: request.url,
              headers: {},
              elapsedMs: 1,
            };
          },
        },
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
        },
      });

      const iframe = container.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      Object.defineProperty(iframe.contentWindow, "postMessage", {
        configurable: true,
        value: (message: unknown) => posted.push(message),
      });
      const readyEvent = new window.MessageEvent("message", {
        data: { channel: "slexkit-secure", type: "ready" },
      });
      Object.defineProperty(readyEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(readyEvent);
      const mountMessage = posted.find((message) =>
        !!message && typeof message === "object" && (message as { type?: unknown }).type === "mount"
      ) as { id: string };

      const fetchEvent = new window.MessageEvent("message", {
        data: {
          channel: "slexkit-secure",
          type: "fetch",
          id: mountMessage.id,
          token: "wrong",
          requestId: "req1",
          request: {
            method: "GET",
            url: "https://example.com/bridge",
            credentials: "omit",
            timeoutMs: 1000,
          },
        },
      });
      Object.defineProperty(fetchEvent, "source", {
        configurable: true,
        value: iframe.contentWindow,
      });
      window.dispatchEvent(fetchEvent);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetched).toBe(0);

      cleanup();
    });


    it("rejects function-bearing Slex source objects for sandbox runner frames", () => {
      const container = setup();
      expect(() => mountSecureArtifact({
        namespace: "runner_reject",
        g: {
          unsafe() {
            return "must be passed as source text";
          },
        },
        layout: {},
      }, container, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
        },
      })).toThrow("Pass Slex source");
      expect(container.querySelector("iframe")).toBeNull();
    });
});
