<script lang="ts">
  import MarkdownRenderer from "./MarkdownRenderer.svelte";
  import SlexCode from "./SlexCode.svelte";
  import type {
    HostRuntimeAdapter,
    HostRuntimePolicy,
    SecureFrameOptions,
    SlexKitMarkdownRuntimeHost,
  } from "slexkit";

  type Props = {
    source: string;
    domain: string;
    runtimeHost: SlexKitMarkdownRuntimeHost;
    securePolicy?: HostRuntimePolicy;
    hostAdapter?: HostRuntimeAdapter;
    secureFrame: SecureFrameOptions;
  };

  let {
    source,
    domain,
    runtimeHost,
    securePolicy = {},
    hostAdapter,
    secureFrame,
  }: Props = $props();

  let content = $state(source);
  const segments = $derived(splitMarkdownSource(content));

  export function updateSource(nextSource: string) {
    content = String(nextSource ?? "");
  }

  // Markdown supplied through query parameters or remote source URLs is host input.
  // Keep raw HTML inert outside explicit slex fences; fence HTML still runs only in
  // the isolated document host owned by SlexCode.
  function splitMarkdownSource(value: string) {
    const sourceText = String(value ?? "");
    const fence = /(^|\n)(`{3,}|~{3,})slex(?:[ \t]+[^\n]*)?\n([\s\S]*?)\n\2(?=\n|$)/g;
    const result: Array<{ id: string; kind: "markdown" | "slex"; content: string }> = [];
    let cursor = 0;
    let blockIndex = 0;

    for (const match of sourceText.matchAll(fence)) {
      const index = match.index ?? 0;
      const prose = sourceText.slice(cursor, index) + (match[1] || "");
      if (prose) result.push({ id: `prose-${blockIndex}`, kind: "markdown", content: escapeRawHtml(prose) });
      result.push({ id: `slex-${blockIndex}`, kind: "slex", content: match[3] });
      blockIndex += 1;
      cursor = index + match[0].length;
    }

    const tail = sourceText.slice(cursor);
    if (tail || !result.length) result.push({ id: `prose-${blockIndex}`, kind: "markdown", content: escapeRawHtml(tail) });
    return result;
  }

  function escapeRawHtml(value: string) {
    return value.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
</script>

{#each segments as segment (segment.id)}
  <div class="slex-playground-document-segment" data-segment-kind={segment.kind}>
    {#if segment.kind === "slex"}
      <SlexCode
        lang="slex"
        text={segment.content}
        {domain}
        renderMode="component"
        runtime="secure"
        {runtimeHost}
        securePolicy={securePolicy}
        hostAdapter={hostAdapter}
        {secureFrame}
        className="slex-doc-slexkit-demo"
      />
    {:else}
      <MarkdownRenderer
        content={segment.content}
        domain={`${domain}:${segment.id}`}
        slexkitRenderMode="component"
        slexkitRuntime="secure"
        slexkitRuntimeHost={runtimeHost}
        slexkitSecurePolicy={securePolicy}
        slexkitHostAdapter={hostAdapter}
        slexkitSecureFrame={secureFrame}
      />
    {/if}
  </div>
{/each}
