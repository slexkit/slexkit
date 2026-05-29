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

describe("secure runtime policy api", () => {
    it("blocks network when host policy does not enable it", async () => {
      const runtime = createSecureRuntime(closedPolicy);
      await expectPolicyError(runtime, runtime.api.get("https://example.com"));
      runtime.dispose();
    });


    it("allows custom request headers only when host policy declares them", async () => {
      const runtime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowHeaders: ["accept", "content-type", "x-api-key"],
        },
      }, {
        fetch: async (request) => ({
          ok: true,
          status: 200,
          statusText: "OK",
          url: request.url,
          headers: {},
          data: request.headers,
          elapsedMs: 1,
        }),
      });

      const result = await runtime.api.get("https://example.com", {
        headers: { "x-api-key": "demo" },
      });
      expect(result.data).toEqual({ "x-api-key": "demo" });
      await expectPolicyError(runtime, runtime.api.get("https://example.com", {
        headers: { authorization: "Bearer token" },
      }));

      runtime.dispose();
    });


    it("checks method, origin, body size, and credentials in api.fetch", async () => {
      const runtime = createSecureRuntime(policy, {
        fetch: async (request) => ({
          ok: true,
          status: 200,
          statusText: "OK",
          url: request.url,
          headers: {},
          data: { ok: true },
          elapsedMs: 3,
        }),
      });

      await expectPolicyError(runtime, runtime.api.get("https://blocked.example"));
      await expectPolicyError(runtime, runtime.api.fetch("https://example.com", { method: "POST", body: "x".repeat(2048) }));
      await expectPolicyError(runtime, runtime.api.get("https://example.com", { credentials: "include" }));
      await expectPolicyError(runtime, runtime.api.get("https://example.com", { headers: { authorization: "Bearer token" } }));

      const result = await runtime.api.post("https://example.com/submit", { ok: true });
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ ok: true });

      runtime.dispose();
    });


    it("does not treat origin prefix wildcards as trusted domains", async () => {
      const runtime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowOrigins: ["https://api.example.com*"],
        },
      });

      await expectPolicyError(runtime, runtime.api.get("https://api.example.com.evil.com"));
      runtime.dispose();
    });


    it("supports explicit scheme and subdomain origin wildcards", async () => {
      const schemeRuntime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowOrigins: ["https://*"],
        },
      }, {
        fetch: async (request) => ({
          ok: true,
          status: 200,
          statusText: "OK",
          url: request.url,
          headers: {},
          elapsedMs: 1,
        }),
      });
      expect((await schemeRuntime.api.get("https://any.example")).status).toBe(200);
      await expectPolicyError(schemeRuntime, schemeRuntime.api.get("http://any.example"));
      schemeRuntime.dispose();

      const subdomainRuntime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowOrigins: ["https://*.example.com"],
        },
      }, {
        fetch: async (request) => ({
          ok: true,
          status: 200,
          statusText: "OK",
          url: request.url,
          headers: {},
          elapsedMs: 1,
        }),
      });
      expect((await subdomainRuntime.api.get("https://api.example.com")).status).toBe(200);
      await expectPolicyError(subdomainRuntime, subdomainRuntime.api.get("https://example.com"));
      await expectPolicyError(subdomainRuntime, subdomainRuntime.api.get("https://api.example.com.evil.com"));
      subdomainRuntime.dispose();
    });


    it("checks the final generated headers for JSON post bodies", async () => {
      const runtime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowHeaders: ["accept"],
        },
      });

      await expectPolicyError(runtime, runtime.api.post("https://example.com/submit", { ok: true }));
      runtime.dispose();
    });


    it("checks response content-type and response size policy", async () => {
      const runtime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowContentTypes: ["application/json"],
          maxResponseBytes: 16,
        },
      }, {
        fetch: async (request) => ({
          ok: true,
          status: 200,
          statusText: "OK",
          url: request.url,
          headers: { "content-type": "text/plain" },
          text: "ok",
          elapsedMs: 1,
        }),
      });
      await expectPolicyError(runtime, runtime.api.get("https://example.com/plain"));
      runtime.dispose();

      const sizeRuntime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowContentTypes: ["text/*"],
          maxResponseBytes: 4,
        },
      }, {
        fetch: async (request) => ({
          ok: true,
          status: 200,
          statusText: "OK",
          url: request.url,
          headers: { "content-type": "text/plain; charset=utf-8" },
          text: "too large",
          elapsedMs: 1,
        }),
      });
      await expectPolicyError(sizeRuntime, sizeRuntime.api.get("https://example.com/large"));
      sizeRuntime.dispose();
    });


    it("emits network log events without letting logger failures affect fetch", async () => {
      const phases: string[] = [];
      const runtime = createSecureRuntime({
        ...policy,
        network: {
          ...policy.network!,
          allowContentTypes: ["application/json"],
        },
      }, {
        fetch: async (request) => ({
          ok: true,
          status: 200,
          statusText: "OK",
          url: request.url,
          headers: { "content-type": "application/json" },
          text: "{}",
          data: {},
          elapsedMs: 1,
        }),
        onNetworkLog(event) {
          phases.push(event.phase);
          if (event.phase === "request") throw new Error("ignored");
        },
      });

      const result = await runtime.api.get("https://example.com/logged");
      expect(result.status).toBe(200);
      expect(phases).toEqual(["request", "response"]);
      runtime.dispose();
    });


    it("tracks timer policy and dispose cleanup", () => {
      const cleared: number[] = [];
      let next = 1;
      const runtime = createSecureRuntime(policy, {
        setTimeout: () => next++,
        clearTimeout: (id) => cleared.push(id),
        setInterval: () => next++,
        clearInterval: (id) => cleared.push(id),
      });

      expect(() => runtime.api.setTimeout(() => {}, 1)).toThrow();
      const timeout = runtime.api.setTimeout(() => {}, 10);
      const interval = runtime.api.setInterval(() => {}, 10);
      expect(() => runtime.api.setTimeout(() => {}, 10)).toThrow();

      runtime.dispose();
      expect(cleared).toContain(timeout);
      expect(cleared).toContain(interval);
    });


    it("blocks raf when animation is disabled and cleans active raf on dispose", () => {
      const blocked = createSecureRuntime({ animation: { enabled: false } });
      expect(() => blocked.api.raf(() => {})).toThrow();
      blocked.dispose();

      const canceled: number[] = [];
      const runtime = createSecureRuntime(policy, {
        requestAnimationFrame: () => 42,
        cancelAnimationFrame: (id) => canceled.push(id),
      });
      runtime.api.raf(() => {});
      runtime.dispose();
      expect(canceled).toEqual([42]);
    });


    it("enforces canvas policy through the runtime api", () => {
      const blocked = createSecureRuntime({ canvas: { enabled: false } });
      expect(() => blocked.api.createCanvas(10, 10)).toThrow();
      blocked.dispose();

      const sizeRuntime = createSecureRuntime({ canvas: { enabled: true, maxPixels: 100 } });
      expect(() => sizeRuntime.api.createCanvas(11, 10)).toThrow();
      sizeRuntime.dispose();

      const runtime = createSecureRuntime({
        canvas: {
          enabled: true,
          maxCanvases: 1,
          maxPixels: 100,
          allowedContexts: ["2d"],
        },
      });
      const canvas = runtime.api.createCanvas(10, 10);
      document.body.appendChild(canvas);
      expect(canvas.width).toBe(10);
      expect(canvas.height).toBe(10);
      expect(() => runtime.api.createCanvas(1, 1)).toThrow();
      expect(() => runtime.api.getCanvasContext(canvas, "webgl")).toThrow();
      runtime.dispose();
      expect(canvas.isConnected).toBe(false);

      const externalRuntime = createSecureRuntime({
        canvas: { enabled: true, maxCanvases: 1, maxPixels: 100, allowedContexts: ["2d"] },
      });
      const external = document.createElement("canvas");
      external.width = 10;
      external.height = 10;
      document.body.appendChild(external);
      const CanvasElement = window.HTMLCanvasElement;
      const originalGetContext = CanvasElement.prototype.getContext;
      CanvasElement.prototype.getContext = (() => ({ canvas: external })) as HTMLCanvasElement["getContext"];
      try {
        externalRuntime.api.getCanvasContext(external);
        expect(() => externalRuntime.api.createCanvas(1, 1)).toThrow();
        externalRuntime.dispose();
        expect(external.isConnected).toBe(true);
      } finally {
        CanvasElement.prototype.getContext = originalGetContext;
        external.remove();
      }
    });


    it("reports runtime callback errors without letting error hooks change behavior", () => {
      const phases: string[] = [];
      let timeoutCallback: (() => void) | undefined;
      let intervalCallback: (() => void) | undefined;
      let rafCallback: ((time: number) => void) | undefined;
      const runtime = createSecureRuntime(policy, {
        setTimeout: (fn) => {
          timeoutCallback = fn;
          return 1;
        },
        clearTimeout: () => {},
        setInterval: (fn) => {
          intervalCallback = fn;
          return 2;
        },
        clearInterval: () => {},
        requestAnimationFrame: (fn) => {
          rafCallback = fn;
          return 3;
        },
        cancelAnimationFrame: () => {},
        onRuntimeError(event) {
          phases.push(event.phase);
          throw new Error("ignored hook failure");
        },
      });

      runtime.api.setTimeout(() => {
        throw new Error("timeout failure");
      }, 10);
      runtime.api.setInterval(() => {
        throw new Error("interval failure");
      }, 10);
      runtime.api.raf(() => {
        throw new Error("raf failure");
      });
      runtime.api.onDispose(() => {
        throw new Error("dispose failure");
      });

      expect(() => timeoutCallback?.()).toThrow("timeout failure");
      expect(() => intervalCallback?.()).toThrow("interval failure");
      expect(() => rafCallback?.(1)).toThrow("raf failure");
      runtime.dispose();
      expect(phases).toEqual(["timer", "interval", "raf", "dispose"]);
    });


    it("injects api into secure expressions and event handlers", async () => {
      const container = setup();
      let fetched = 0;

      mountSecureArtifact({
        namespace: `secure_api_${Date.now()}`,
        g: {
          value: "",
          async load(api: { get: (url: string) => Promise<{ status: number }> }) {
            const res = await api.get("https://example.com/ping");
            this.value = String(res.status);
          },
        },
        layout: {
          "button:load": {
            label: "Load",
            onclick: "g.load(api)",
          },
          "text:value": {
            $text: "api.now() >= 0 ? 'status:' + g.value : ''",
          },
        },
      }, container, {
        policy,
        unsafeInlineExecution: true,
        hostAdapter: {
          fetch: async () => {
            fetched += 1;
            return {
              ok: true,
              status: 204,
              statusText: "No Content",
              url: "https://example.com/ping",
              headers: {},
              elapsedMs: 1,
            };
          },
        },
      });

      expect(container.dataset.slexkitSecureRuntime).toBe("true");
      (container.querySelector("button") as HTMLButtonElement).click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetched).toBe(1);
      expect(container.textContent).toContain("204");
    });


    it("keeps legacy mount working without api", () => {
      const container = setup();
      mount({
        namespace: `legacy_${Date.now()}`,
        g: { value: 7 },
        layout: {
          "text:value": {
            $text: "'value:' + g.value",
          },
        },
      }, container);
      expect(container.textContent).toContain("value:7");
    });
});
