<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

{#if p.label || p.icon}
  <div class="slex-divider slex-divider--labeled" role="separator">
    <span class="slex-divider-label">
      {#if p.icon}<InlineIcon name={p.icon} className="slex-divider-icon" />{/if}
      {#if p.label}<span>{text(p.label)}</span>{/if}
    </span>
  </div>
{:else}
  <hr class="slex-divider" />
{/if}
