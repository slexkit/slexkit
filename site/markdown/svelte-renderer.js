import { mount, unmount } from "svelte";
import MarkdownRenderer from "./MarkdownRenderer.svelte";

let markdownDomainId = 0;

function containerDomain(container) {
  if (!container.dataset.slexkitMarkdownDomain) {
    markdownDomainId += 1;
    container.dataset.slexkitMarkdownDomain = `markdown:${markdownDomainId}`;
  }
  return container.dataset.slexkitMarkdownDomain;
}

export function renderMarkdown(content, container, options = {}) {
  const app = mount(MarkdownRenderer, {
    target: container,
    props: {
      content,
      domain: options.domain ?? containerDomain(container),
      slexkitRenderMode: options.slexkitRenderMode ?? "component",
      slexkitRuntime: options.slexkitRuntime ?? "trusted",
      slexkitRuntimeHost: options.slexkitRuntimeHost,
      slexkitUseGlobalRuntimeHost: options.slexkitUseGlobalRuntimeHost ?? false,
      slexkitSecurePolicy: options.slexkitSecurePolicy ?? {},
      slexkitHostAdapter: options.slexkitHostAdapter,
      slexkitSecureFrame: options.slexkitSecureFrame ?? true,
    },
  });

  return () => {
    void unmount(app);
  };
}
