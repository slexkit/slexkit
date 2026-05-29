<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { itemDescription, itemLabel, rows } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<svelte:element this={p.ordered === true ? "ol" : "ul"} class="slex-list" data-ordered={p.ordered === true ? "true" : "false"}>
  {#each rows(p.items) as item}
    <li>{itemLabel(item)}{#if itemDescription(item)}<span class="slex-list-description">{itemDescription(item)}</span>{/if}</li>
  {/each}
</svelte:element>
