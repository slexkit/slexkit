import { mount, unmount } from "svelte";
import { attachComponentDisposer, createSlexKitMarkdownRuntimeHost, register } from "slexkit";
import { withSiteBase } from "../app/site-base.js";
import { registerSiteComponents } from "../app/site-components.js";
import MarkdownRenderer from "./MarkdownRenderer.svelte";

let markdownDomainId = 0;
let siteComponentsRegistered = false;

function ensureSiteComponentsRegistered() {
  if (siteComponentsRegistered) return;
  registerSiteComponents({ register, attachComponentDisposer });
  siteComponentsRegistered = true;
}

function containerDomain(container) {
  if (!container.dataset.slexkitMarkdownDomain) {
    markdownDomainId += 1;
    container.dataset.slexkitMarkdownDomain = `markdown:${markdownDomainId}`;
  }
  return container.dataset.slexkitMarkdownDomain;
}

function rewriteRootRelativeUrls(container) {
  const selectors = [
    "a[href]",
    "area[href]",
    "iframe[src]",
    "img[src]",
    "source[src]",
    "audio[src]",
    "video[src]",
  ].join(",");

  container.querySelectorAll(selectors).forEach((element) => {
    for (const attr of ["href", "src"]) {
      const value = element.getAttribute(attr);
      if (!value || !value.startsWith("/") || value.startsWith("//")) continue;
      const nextValue = withSiteBase(value);
      if (nextValue !== value) element.setAttribute(attr, nextValue);
    }
  });
}

function frameContentHeight(frame) {
  const doc = frame.contentDocument;
  if (!doc) return 0;
  const root = doc.documentElement;
  const body = doc.body;
  return Math.max(
    root?.scrollHeight ?? 0,
    root?.offsetHeight ?? 0,
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
  );
}

function bindLiveExampleFrames(container) {
  const cleanups = [];
  const frames = container.querySelectorAll("iframe.slex-example-live-frame");

  frames.forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement)) return;
    frame.setAttribute("scrolling", "no");

    let observer;
    let observedDoc;
    let raf = 0;
    const timers = [];
    const win = frame.ownerDocument.defaultView;
    const scheduleResize = () => {
      if (!win) return;
      if (raf) win.cancelAnimationFrame(raf);
      raf = win.requestAnimationFrame(() => {
        raf = 0;
        try {
          const height = frameContentHeight(frame);
          if (height > 0) frame.style.height = `${Math.ceil(height)}px`;
        } catch {
          // Cross-origin frames keep their CSS fallback height.
        }
      });
    };

    const observeContent = () => {
      scheduleResize();
      try {
        const doc = frame.contentDocument;
        const resizeObserver = frame.contentWindow?.ResizeObserver;
        if (!doc || !resizeObserver) return;
        if (observer && observedDoc !== doc) {
          observedDoc?.defaultView?.removeEventListener("resize", scheduleResize);
          observer.disconnect();
          observer = undefined;
          observedDoc = undefined;
        }
        if (observer) return;
        observer = new resizeObserver(scheduleResize);
        observedDoc = doc;
        if (doc.documentElement) observer.observe(doc.documentElement);
        if (doc.body) observer.observe(doc.body);
        doc.defaultView?.addEventListener("resize", scheduleResize);
      } catch {
        // Cross-origin frames keep their CSS fallback height.
      }
    };

    frame.addEventListener("load", observeContent);
    observeContent();
    for (const delay of [100, 350, 800, 1600, 3200]) {
      if (win) timers.push(win.setTimeout(observeContent, delay));
    }
    cleanups.push(() => {
      frame.removeEventListener("load", observeContent);
      if (raf && win) win.cancelAnimationFrame(raf);
      for (const timer of timers) win?.clearTimeout(timer);
      try {
        observedDoc?.defaultView?.removeEventListener("resize", scheduleResize);
      } catch {
        // Cross-origin frames keep their CSS fallback height.
      }
      observer?.disconnect();
    });
  });

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

export function renderMarkdown(content, container, options = {}) {
  ensureSiteComponentsRegistered();
  const domain = options.domain ?? containerDomain(container);
  const ownsRuntimeHost = !options.slexkitRuntimeHost;
  const runtimeHost = options.slexkitRuntimeHost ?? createSlexKitMarkdownRuntimeHost({
    mode: options.slexkitRuntime ?? "trusted",
    policy: options.slexkitSecurePolicy ?? {},
    hostAdapter: options.slexkitHostAdapter,
    secureFrame: options.slexkitSecureFrame ?? true,
  });
  const app = mount(MarkdownRenderer, {
    target: container,
    props: {
      content,
      domain,
      slexkitRenderMode: options.slexkitRenderMode ?? "component",
      slexkitRuntime: options.slexkitRuntime ?? "trusted",
      slexkitRuntimeHost: runtimeHost,
      slexkitUseGlobalRuntimeHost: options.slexkitUseGlobalRuntimeHost ?? false,
      slexkitSecurePolicy: options.slexkitSecurePolicy ?? {},
      slexkitHostAdapter: options.slexkitHostAdapter,
      slexkitSecureFrame: options.slexkitSecureFrame ?? true,
      slexkitStreaming: options.slexkitStreaming ?? false,
      slexkitIncomplete: options.slexkitIncomplete ?? false,
    },
  });
  let active = true;
  const rewrite = () => {
    if (active) rewriteRootRelativeUrls(container);
  };
  const cleanupLiveFrames = bindLiveExampleFrames(container);

  rewrite();
  queueMicrotask(rewrite);
  container.ownerDocument.defaultView?.requestAnimationFrame(rewrite);

  return () => {
    active = false;
    cleanupLiveFrames();
    void unmount(app);
    runtimeHost.disposeArtifact(domain);
    if (ownsRuntimeHost) runtimeHost.disposeAll();
  };
}
