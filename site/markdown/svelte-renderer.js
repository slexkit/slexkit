import { mount, unmount } from "svelte";
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
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

  return () => {
    void unmount(app);
    runtimeHost.disposeArtifact(domain);
    if (ownsRuntimeHost) runtimeHost.disposeAll();
  };
}
