<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function value(): number {
    const next = Number(p.value ?? 0);
    return Number.isFinite(next) ? Math.min(100, Math.max(0, next)) : 0;
  }
</script>

<div
  class="slex-progress"
  data-scope="progress"
  data-state={p.indeterminate ? "indeterminate" : "determinate"}
  role="progressbar"
  aria-label={text(p["aria-label"] ?? p.ariaLabel ?? p.label) || undefined}
  aria-valuemin={p.indeterminate ? undefined : 0}
  aria-valuemax={p.indeterminate ? undefined : 100}
  aria-valuenow={p.indeterminate ? undefined : value()}
>
  {#if p.label || p.icon}
    <div class="slex-progress-label">
      {#if p.icon}<InlineIcon name={p.icon} className="slex-progress-icon" />{/if}
      {#if p.label}<span>{text(p.label)}</span>{/if}
    </div>
  {/if}
  <div class="slex-progress-track"><div class="slex-progress-range" style:width={`${value()}%`}></div></div>
</div>
