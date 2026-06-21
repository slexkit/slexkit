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

describe("secure markdown artifact bridge", () => {

    it("lets a markdown runtime host own block lifecycle across an artifact", () => {
      const runtime = createSlexKitMarkdownRuntimeHost();
      const stateContainer = document.createElement("div");
      const container = setup();

      runtime.mountBlock({
        artifactId: "doc",
        container: stateContainer,
        stateOnly: true,
        source: `({ namespace: "markdown_host", g: { saved: 9 } })`,
      });
      runtime.mountBlock({
        artifactId: "doc",
        container,
        source: `({
          namespace: "markdown_host",
          layout: { "text:value": { $text: "'value:' + g.saved" } },
        })`,
      });

      expect(container.textContent).toContain("value:9");
      runtime.disposeArtifact("doc");
      expect(container.querySelector(".slexkit-root")).toBeNull();

      runtime.mountBlock({
        artifactId: "doc",
        container,
        source: `({
          namespace: "markdown_host",
          layout: { "text:value": { $text: "'value:' + String(g.saved)" } },
        })`,
      });

      expect(container.textContent).toContain("value:undefined");
      runtime.disposeArtifact("doc");
    });


    it("applies host-level preview execution mode unless a block overrides it", () => {
      const runtime = createSlexKitMarkdownRuntimeHost({ executionMode: "preview" });
      const previewContainer = setup();

      runtime.mountBlock({
        artifactId: "preview-doc",
        container: previewContainer,
        source: `({
          namespace: "markdown_preview_default",
          g: { count: 0 },
          layout: {
            "button:add": { label: "Add", onclick: "g.count++" },
            "text:value": { $text: "'count:' + String(g.count)" },
          },
        })`,
      });

      expect(previewContainer.querySelector(".slexkit-root")?.getAttribute("data-execution-mode")).toBe("preview");
      expect(previewContainer.textContent).toContain("count:0");
      (previewContainer.querySelector(".slex-button") as HTMLButtonElement).click();
      expect(previewContainer.textContent).toContain("count:0");
      runtime.disposeArtifact("preview-doc");

      const liveContainer = setup();
      runtime.mountBlock({
        artifactId: "preview-doc",
        container: liveContainer,
        executionMode: "live",
        source: `({
          namespace: "markdown_preview_default",
          g: { count: 0 },
          layout: {
            "button:add": { label: "Add", onclick: "g.count++" },
            "text:value": { $text: "'count:' + String(g.count)" },
          },
        })`,
      });

      expect(liveContainer.querySelector(".slexkit-root")?.getAttribute("data-execution-mode")).toBe("live");
      (liveContainer.querySelector(".slex-button") as HTMLButtonElement).click();
      expect(liveContainer.textContent).toContain("count:1");
      runtime.disposeArtifact("preview-doc");
    });


    it("scopes and disposes default trusted markdown artifact namespaces", () => {
      const runtime = createSlexKitMarkdownRuntimeHost();
      const stateContainer = document.createElement("div");
      const container = setup();

      runtime.mountBlock({
        artifactId: "default-doc",
        container: stateContainer,
        stateOnly: true,
        source: `({ g: { saved: 4 } })`,
      });
      runtime.mountBlock({
        artifactId: "default-doc",
        container,
        source: `({
          layout: { "text:value": { $text: "'value:' + g.saved" } },
        })`,
      });

      expect(container.textContent).toContain("value:4");
      runtime.disposeArtifact("default-doc");

      runtime.mountBlock({
        artifactId: "default-doc",
        container,
        source: `({
          layout: { "text:value": { $text: "'value:' + String(g.saved)" } },
        })`,
      });

      expect(container.textContent).toContain("value:undefined");
      runtime.disposeArtifact("default-doc");
    });


    it("keeps matching trusted namespaces isolated across markdown artifacts", () => {
      const runtime = createSlexKitMarkdownRuntimeHost();
      const firstState = document.createElement("div");
      const secondState = document.createElement("div");
      const first = setup();
      const second = document.createElement("div");
      document.body.appendChild(second);

      runtime.mountBlock({
        artifactId: "page-a",
        container: firstState,
        stateOnly: true,
        source: `({ namespace: "shared", g: { saved: 1 } })`,
      });
      runtime.mountBlock({
        artifactId: "page-a",
        container: first,
        source: `({ namespace: "shared", layout: { "text:value": { $text: "'a:' + g.saved" } } })`,
      });
      runtime.mountBlock({
        artifactId: "page-b",
        container: secondState,
        stateOnly: true,
        source: `({ namespace: "shared", g: { saved: 2 } })`,
      });
      runtime.mountBlock({
        artifactId: "page-b",
        container: second,
        source: `({ namespace: "shared", layout: { "text:value": { $text: "'b:' + g.saved" } } })`,
      });

      expect(first.textContent).toContain("a:1");
      expect(second.textContent).toContain("b:2");

      runtime.disposeArtifact("page-a");
      runtime.mountBlock({
        artifactId: "page-a",
        container: first,
        source: `({ namespace: "shared", layout: { "text:value": { $text: "'a:' + String(g.saved)" } } })`,
      });

      expect(first.textContent).toContain("a:undefined");
      expect(second.textContent).toContain("b:2");
      runtime.disposeAll();
      second.remove();
    });

    it("keeps trusted markdown slider bindings separate from sibling select state", () => {
      const runtime = createSlexKitMarkdownRuntimeHost();
      const container = setup();

      runtime.mountBlock({
        artifactId: "cross-doc-controls",
        container,
        source: `({
          slex: "0.1",
          namespace: "cross_doc_controls",
          g: { color: "blue", size: 16 },
          layout: {
            "grid:controls": {
              "select:color": {
                label: "Color",
                "$value": "g.color",
                options: [
                  { label: "Blue", value: "blue" },
                  { label: "Green", value: "green" },
                ],
                onchange: "g.color = String($event)",
              },
              "slider:size": {
                label: "Size",
                "$value": "g.size",
                min: 8,
                max: 48,
                step: 2,
                unit: "px",
                onchange: "g.size = Number($event)",
              },
              "badge:note": { "$label": "'style ' + g.color + ' ' + g.size + 'px'" },
            },
          },
        })`,
      });
      const observer = document.createElement("div");
      document.body.appendChild(observer);
      runtime.mountBlock({
        artifactId: "cross-doc-controls",
        container: observer,
        source: `({
          slex: "0.1",
          namespace: "cross_doc_controls",
          layout: {
            "card:observer": {
              "stat:size": { "$label": "'Size: ' + g.size + 'px'", "$value": "g.color" },
            },
          },
        })`,
      });

      expect(container.querySelector(".slex-slider-value")?.textContent).toBe("16px");
      const input = container.querySelector(".slex-slider") as HTMLInputElement;
      const control = container.querySelector(".slex-slider-control") as HTMLElement;
      expect(input.value).toBe("16");
      expect(control.style.getPropertyValue("--slex-slider-progress")).toBe("20%");
      expect(container.querySelector(".slex-badge")?.textContent).toContain("style blue 16px");

      runtime.disposeArtifact("cross-doc-controls");
      observer.remove();
    });


    it("uses one secure sandbox frame for all blocks in the same markdown artifact", () => {
      const runtime = createSlexKitMarkdownRuntimeHost({
        mode: "secure",
        policy,
        secureFrame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          loadTimeoutMs: 0,
        },
      });
      const first = setup();
      const second = document.createElement("div");
      document.body.appendChild(second);

      runtime.mountBlock({
        artifactId: "secure-doc",
        container: first,
        source: `({ namespace: "shared", g: { value: 1 } })`,
      });
      runtime.mountBlock({
        artifactId: "secure-doc",
        container: second,
        source: `({ namespace: "shared", layout: { "text:value": { $text: "'value:' + g.value" } } })`,
      });

      expect(document.querySelectorAll("iframe[data-slexkit-secure-frame='true']")).toHaveLength(1);
      expect(first.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeTruthy();
      expect(second.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeNull();
      expect(second.dataset.slexkitSecureArtifactSlot).toBe("true");

      runtime.disposeArtifact("secure-doc");
      expect(document.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeNull();
      second.remove();
    });


    it("preserves all renderable secure markdown fences in artifact order", () => {
      const runtime = createSlexKitMarkdownRuntimeHost({
        mode: "secure",
        policy,
        secureFrame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          loadTimeoutMs: 0,
        },
      });
      const first = setup();
      const second = document.createElement("div");
      document.body.appendChild(second);
      const posted: unknown[] = [];

      runtime.mountBlock({
        artifactId: "ordered-secure-doc",
        container: second,
        source: {
          namespace: "ordered",
          layout: {
            "text:second": { $text: "'Second ' + g.value" },
          },
        },
      });
      runtime.mountBlock({
        artifactId: "ordered-secure-doc",
        container: first,
        source: `({ namespace: "ordered", g: { value: 2 }, layout: { "text:first": { text: "First" } } })`,
      });

      const iframe = first.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(second.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeNull();
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
      ) as { input: string };
      const composed = (0, eval)(mountMessage.input) as { layout: Record<string, Record<string, unknown>> };
      const artifact = composed.layout["column:artifact"];
      expect(Object.keys(artifact)).toEqual(["column:block_0", "column:block_1"]);
      expect(artifact["column:block_0"]).toEqual({ id: "slexkit-slot-slot_0", "text:first": { text: "First" } });
      expect(artifact["column:block_1"]).toEqual({ id: "slexkit-slot-slot_1", "text:second": { $text: "'Second ' + g.value" } });

      runtime.disposeArtifact("ordered-secure-doc");
      second.remove();
    });


    it("composes secure cross-document markdown fences with shared state", () => {
      const runtime = createSlexKitMarkdownRuntimeHost({
        mode: "secure",
        policy,
        secureFrame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          loadTimeoutMs: 0,
        },
      });
      const start = setup();
      const middle = document.createElement("div");
      const end = document.createElement("div");
      document.body.append(middle, end);
      const posted: unknown[] = [];

      runtime.mountBlock({
        artifactId: "secure-cross-doc",
        container: start,
        source: `({
          namespace: "cross",
          g: {
            confidence: 58,
            reviewed: false,
            score: function () { return this.confidence + (this.reviewed ? 22 : 0); },
          },
          layout: { "card:start": { "stat:score": { "$value": "g.score()" } } },
        })`,
      });
      runtime.mountBlock({
        artifactId: "secure-cross-doc",
        container: middle,
        source: `{
          namespace: "cross",
          layout: { "card:middle": { "checkbox:reviewed": { "$checked": "g.reviewed", "onchange": "g.reviewed = Boolean($event)" } } },
        }`,
      });
      runtime.mountBlock({
        artifactId: "secure-cross-doc",
        container: end,
        source: `({
          namespace: "cross",
          layout: { "card:end": { "stat:final": { "$value": "g.score()" } } },
        })`,
      });

      const iframe = start.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(middle.dataset.slexkitSecureArtifactSlot).toBe("true");
      expect(end.dataset.slexkitSecureArtifactSlot).toBe("true");
      expect(document.querySelectorAll("iframe[data-slexkit-secure-frame='true']")).toHaveLength(1);

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
      ) as { input: string };
      const composed = (0, eval)(mountMessage.input) as { namespace: string; g: Record<string, unknown>; layout: Record<string, Record<string, unknown>> };
      expect(composed.namespace).toBe("secure-cross-doc::cross");
      expect(composed.g.confidence).toBe(58);
      expect(typeof composed.g.score).toBe("function");
      expect(Object.keys(composed.layout["column:artifact"])).toEqual(["column:block_0", "column:block_1", "column:block_2"]);

      runtime.disposeArtifact("secure-cross-doc");
      middle.remove();
      end.remove();
    });


    it("bridges secure markdown artifact slot rects and size updates", async () => {
      const first = setup();
      const second = document.createElement("div");
      document.body.appendChild(second);
      const posted: unknown[] = [];
      let secondTop = 240;
      const cleanup = mountSecureArtifact(`({
        namespace: "slot_bridge",
        layout: {
          "column:artifact": {
            "column:block_0": { id: "slexkit-slot-slot_0", "text:first": { text: "First" } },
            "column:block_1": { id: "slexkit-slot-slot_1", "text:second": { text: "Second" } },
          },
        },
      })`, first, {
        policy,
        frame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
          loadTimeoutMs: 0,
        },
        artifactSlots: [
          { id: "slot_0", container: first },
          { id: "slot_1", container: second },
        ],
      });

      try {
        const iframe = first.querySelector("iframe[data-slexkit-secure-frame='true']") as HTMLIFrameElement;
        Object.defineProperty(first, "getBoundingClientRect", {
          configurable: true,
          value: () => domRect(10, 100, 300, 40),
        });
        Object.defineProperty(second, "getBoundingClientRect", {
          configurable: true,
          value: () => domRect(10, secondTop, 300, 50),
        });
        Object.defineProperty(iframe, "getBoundingClientRect", {
          configurable: true,
          value: () => domRect(10, 100, 300, 1),
        });
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
        const mountedEvent = new window.MessageEvent("message", {
          data: {
            channel: "slexkit-secure",
            type: "mounted",
            id: mountMessage.id,
            token: mountMessage.token,
          },
        });
        Object.defineProperty(mountedEvent, "source", {
          configurable: true,
          value: iframe.contentWindow,
        });
        window.dispatchEvent(mountedEvent);

        const slotsMessage = posted.find((message) =>
          !!message && typeof message === "object" && (message as { type?: unknown }).type === "slots"
        ) as { slots: Array<{ id: string; left: number; top: number; width: number; height: number }> };
        expect(slotsMessage.slots.map((slot) => slot.id)).toEqual(["slot_0", "slot_1"]);
        expect(slotsMessage.slots[0]).toEqual({ id: "slot_0", left: 0, top: 0, width: 300, height: 40 });
        expect(slotsMessage.slots[1]).toEqual({ id: "slot_1", left: 0, top: 140, width: 300, height: 50 });
        expect(iframe.style.position).toBe("absolute");
        expect(iframe.style.height).toBe("190px");
        expect(first.style.position).toBe("relative");
        expect(first.dataset.slexkitSecureArtifactSlotId).toBe("slot_0");
        expect(second.dataset.slexkitSecureArtifactSlotId).toBe("slot_1");

        const sizeEvent = new window.MessageEvent("message", {
          data: {
            channel: "slexkit-secure",
            type: "slot-size",
            id: mountMessage.id,
            token: mountMessage.token,
            slotId: "slot_1",
            height: 123.2,
          },
        });
        Object.defineProperty(sizeEvent, "source", {
          configurable: true,
          value: iframe.contentWindow,
        });
        window.dispatchEvent(sizeEvent);
        expect(second.style.minHeight).toBe("124px");
        await nextAnimationFrame();
        const slotMessagesAfterSize = posted.filter((message) =>
          !!message && typeof message === "object" && (message as { type?: unknown }).type === "slots"
        );
        expect(slotMessagesAfterSize.length).toBeGreaterThan(1);

        secondTop = 300;
        window.dispatchEvent(new Event("resize"));
        await nextAnimationFrame();
        const latestSlotsMessage = posted.filter((message) =>
          !!message && typeof message === "object" && (message as { type?: unknown }).type === "slots"
        ).at(-1) as { slots: Array<{ id: string; top: number }> };
        expect(latestSlotsMessage.slots[1].top).toBe(200);
        expect(iframe.style.height).toBe("250px");
      } finally {
        cleanup();
        expect(first.style.position).toBe("");
        expect(second.style.minHeight).toBe("");
        second.remove();
      }
    });


    it("installs a global markdown runtime host for plugin renderers", () => {
      const runtime = installSlexKitMarkdownRuntimeHost({
        mode: "secure",
        policy,
        secureFrame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
        },
      });
      expect(getSlexKitMarkdownRuntimeHost()).toBe(runtime);
      runtime.disposeAll();
    });
});
