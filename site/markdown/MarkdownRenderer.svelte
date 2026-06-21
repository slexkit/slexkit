<script lang="ts">
  import SvelteMarkdown from "../../node_modules/@humanspeak/svelte-markdown/dist/index.js";
  import { AlertRenderer, KatexRenderer, markedAlert, markedKatex } from "../../node_modules/@humanspeak/svelte-markdown/dist/extensions/index.js";
  import { normalizeHeadingAnchors } from "./headings.js";
  import SlexCode from "./SlexCode.svelte";
  import type {
    SlexKitMarkdownRuntimeHost,
    HostRuntimeAdapter,
    HostRuntimePolicy,
    SecureFrameOptions,
    SlexStreamingMode,
  } from "slexkit";

  type RenderMode = "component" | "playground";
  type RuntimeMode = "trusted" | "secure";

  type Props = {
    content: string;
    domain?: string;
    slexkitRenderMode?: RenderMode;
    slexkitRuntime?: RuntimeMode;
    slexkitRuntimeHost?: SlexKitMarkdownRuntimeHost;
    slexkitUseGlobalRuntimeHost?: boolean;
    slexkitSecurePolicy?: HostRuntimePolicy;
    slexkitHostAdapter?: HostRuntimeAdapter;
    slexkitSecureFrame?: boolean | SecureFrameOptions;
    slexkitStreaming?: SlexStreamingMode | true;
    slexkitIncomplete?: boolean;
  };

  let {
    content,
    domain,
    slexkitRenderMode = "component",
    slexkitRuntime = "trusted",
    slexkitRuntimeHost,
    slexkitUseGlobalRuntimeHost = false,
    slexkitSecurePolicy = {},
    slexkitHostAdapter,
    slexkitSecureFrame = true,
    slexkitStreaming = false,
    slexkitIncomplete = false,
  }: Props = $props();

  const extensions = [markedKatex({ singleDollarInline: true }), markedAlert()];
  const renderers = {
    alert: AlertRenderer,
    inlineKatex: KatexRenderer,
    blockKatex: KatexRenderer,
  };

  const options = { headerIds: false };
</script>

<div class="slex-doc-streamdown">
  <SvelteMarkdown source={normalizeHeadingAnchors(content)} {extensions} {renderers} {options}>
    {#snippet code({ lang, text })}
      <SlexCode
        {lang}
        {text}
        {domain}
        renderMode={slexkitRenderMode}
        runtime={slexkitRuntime}
        runtimeHost={slexkitRuntimeHost}
        useGlobalRuntimeHost={slexkitUseGlobalRuntimeHost}
        securePolicy={slexkitSecurePolicy}
        hostAdapter={slexkitHostAdapter}
        secureFrame={slexkitSecureFrame}
        streaming={slexkitStreaming}
        incomplete={slexkitIncomplete}
        className="slex-doc-slexkit-demo"
      />
    {/snippet}
  </SvelteMarkdown>
</div>
