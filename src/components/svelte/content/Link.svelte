<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<a
  class="slex-link"
  data-variant={text(p.variant)}
  href={text(p.href, "#")}
  target={text(p.target) || undefined}
  rel={p.target === "_blank" ? "noreferrer" : undefined}
>
  {#if p.icon}<InlineIcon name={p.icon} className="slex-link-icon" />{/if}
  <span>{text(p.text ?? p.label ?? p.content ?? p.href)}</span>
</a>
