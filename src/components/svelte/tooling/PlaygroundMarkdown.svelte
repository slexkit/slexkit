<script lang="ts">
  import SvelteMarkdown from "../../../../node_modules/@humanspeak/svelte-markdown/dist/index.js";
  import { KatexRenderer, markedKatex } from "../../../../node_modules/@humanspeak/svelte-markdown/dist/extensions/index.js";
  import PlaygroundSlexCode from "./PlaygroundSlexCode.svelte";

  type Props = {
    content: string;
    domain?: string;
  };

  let { content, domain }: Props = $props();

  const extensions = [markedKatex({ singleDollarInline: true })];
  const renderers = {
    inlineKatex: KatexRenderer,
    blockKatex: KatexRenderer,
  };
</script>

<div class="slex-doc-streamdown">
  <SvelteMarkdown source={content} {extensions} {renderers}>
    {#snippet code({ lang, text })}
      <PlaygroundSlexCode {lang} {text} {domain} />
    {/snippet}
  </SvelteMarkdown>
</div>
