<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
  const levels = new Set([1, 2, 3, 4, 5, 6]);

  function tag(): string {
    return `h${levels.has(Number(p.level)) ? Number(p.level) : 2}`;
  }
</script>

<div class="slex-heading" data-level={text(p.level ?? 2)}>
  {#if p.eyebrow}<div class="slex-heading-eyebrow">{text(p.eyebrow)}</div>{/if}
  <svelte:element this={tag()} class="slex-heading-title">{text(p.title ?? p.text ?? p.content ?? p.label ?? componentName)}</svelte:element>
  {#if p.meta}<div class="slex-heading-meta">{text(p.meta)}</div>{/if}
  {#if p.subtitle}<p class="slex-heading-subtitle">{text(p.subtitle)}</p>{/if}
</div>
