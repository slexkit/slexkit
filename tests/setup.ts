import { mock } from "bun:test";
import { JSDOM } from "jsdom";
import { readFile } from "node:fs/promises";
import { compile, compileModule } from "svelte/compiler";

Bun.plugin({
  name: "svelte-transform",
  setup(build) {
    build.onResolve({ filter: /^@humanspeak\/svelte-markdown$/ }, () => ({
      path: `${import.meta.dir}/../node_modules/@humanspeak/svelte-markdown/dist/index.js`,
    }));
    build.onResolve({ filter: /^@humanspeak\/svelte-markdown\/extensions$/ }, () => ({
      path: `${import.meta.dir}/../node_modules/@humanspeak/svelte-markdown/dist/extensions/index.js`,
    }));
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
      const code = await readFile(path, "utf8");
      const result = compile(code, {
        filename: path,
        generate: "client",
        dev: true,
      });

      return {
        contents: result.js.code,
        loader: "js",
      };
    });
    build.onLoad({ filter: /\.svelte\.(js|ts)$/ }, async ({ path }) => {
      const code = await readFile(path, "utf8");
      const result = compileModule(code, {
        filename: path,
        dev: true,
      });

      return {
        contents: result.js.code,
        loader: "js",
      };
    });
  },
});

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  configurable: true,
  writable: true,
});

const globals: Record<string, unknown> = {
  window: dom.window,
  Window: dom.window.Window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Text: dom.window.Text,
  Comment: dom.window.Comment,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLScriptElement: dom.window.HTMLScriptElement,
  HTMLMediaElement: dom.window.HTMLMediaElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Event: dom.window.Event,
  InputEvent: dom.window.InputEvent,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  CustomEvent: dom.window.CustomEvent,
  DOMParser: dom.window.DOMParser,
  AnimationEvent: dom.window.Event,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
};

for (const [key, value] of Object.entries(globals)) {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

const ResizeObserverMock = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverMock,
  configurable: true,
  writable: true,
});
Object.defineProperty(dom.window, "ResizeObserver", {
  value: ResizeObserverMock,
  configurable: true,
  writable: true,
});

const MutationObserverMock = class {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
};

Object.defineProperty(globalThis, "MutationObserver", {
  value: MutationObserverMock,
  configurable: true,
  writable: true,
});
Object.defineProperty(dom.window, "MutationObserver", {
  value: MutationObserverMock,
  configurable: true,
  writable: true,
});

class PointerEventMock extends dom.window.Event {
  button: number;
  clientX: number;
  clientY: number;
  constructor(type: string, init?: PointerEventInit) {
    super(type, init);
    this.button = init?.button ?? 0;
    this.clientX = init?.clientX ?? 0;
    this.clientY = init?.clientY ?? 0;
  }
}

Object.defineProperty(globalThis, "PointerEvent", {
  value: PointerEventMock,
  configurable: true,
  writable: true,
});
Object.defineProperty(dom.window, "PointerEvent", {
  value: PointerEventMock,
  configurable: true,
  writable: true,
});

const matchMediaMock = (query: string): MediaQueryList => ({
  media: query,
  matches: false,
  onchange: null,
  addListener: mock(),
  removeListener: mock(),
  addEventListener: mock(),
  removeEventListener: mock(),
  dispatchEvent: mock(() => false),
}) as unknown as MediaQueryList;

Object.defineProperty(globalThis, "matchMedia", {
  value: matchMediaMock,
  configurable: true,
  writable: true,
});
Object.defineProperty(dom.window, "matchMedia", {
  value: matchMediaMock,
  configurable: true,
  writable: true,
});

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = mock() as unknown as typeof Element.prototype.scrollTo;
}

if (!dom.window.Range.prototype.getClientRects) {
  dom.window.Range.prototype.getClientRects = function getClientRects() {
    return [] as unknown as DOMRectList;
  };
}

if (!dom.window.Range.prototype.getBoundingClientRect) {
  dom.window.Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

if (!Element.prototype.animate) {
  Element.prototype.animate = mock(() => ({
    finished: Promise.resolve(),
    cancel: mock(),
    commitStyles: mock(),
    addEventListener: mock(),
    removeEventListener: mock(),
  })) as unknown as typeof Element.prototype.animate;
}

if (typeof globalThis.CSS === "undefined") {
  Object.defineProperty(globalThis, "CSS", {
    value: { escape: (value: string) => value.replace(/[^\w-]/g, "\\$&") },
    configurable: true,
    writable: true,
  });
} else if (!CSS.escape) {
  (CSS as Record<string, unknown>).escape = (value: string) => value.replace(/[^\w-]/g, "\\$&");
}
