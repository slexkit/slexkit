import { mount, unmount } from "svelte";
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import { withSiteBase } from "../app/site-base.js";
import MarkdownRenderer from "./MarkdownRenderer.svelte";

let markdownDomainId = 0;

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

export function renderMarkdown(content, container, options = {}) {
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
    },
  });
  let active = true;
  const rewrite = () => {
    if (active) rewriteRootRelativeUrls(container);
  };

  rewrite();
  queueMicrotask(rewrite);
  container.ownerDocument.defaultView?.requestAnimationFrame(rewrite);

  return () => {
    active = false;
    void unmount(app);
    runtimeHost.disposeArtifact(domain);
    if (ownsRuntimeHost) runtimeHost.disposeAll();
  };
}
