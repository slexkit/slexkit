<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<div
  class="slex-card"
  data-tone={p.tone ? text(p.tone) : undefined}
  data-variant={p.variant || p.presentation ? text(p.variant ?? p.presentation) : undefined}
>
  {#if p.title || p.icon}
    <div class="slex-card-title">{#if p.icon}<InlineIcon name={p.icon} className="slex-card-icon" />{/if}{#if p.title}<span>{text(p.title)}</span>{/if}</div>
  {/if}
  <div class="slex-card-body" use:renderChildren={ctx}></div>
</div>
