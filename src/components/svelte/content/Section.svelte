<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<section class="slex-section" id={text(p.id ?? componentName) || undefined}>
  {#if p.title || p.subtitle || p.eyebrow}
    <header class="slex-section-header">
      {#if p.eyebrow}<div class="slex-section-eyebrow">{text(p.eyebrow)}</div>{/if}
      {#if p.title || p.icon}
        <h2 class="slex-section-title">{#if p.icon}<InlineIcon name={p.icon} className="slex-section-icon" />{/if}{#if p.title}<span>{text(p.title)}</span>{/if}</h2>
      {/if}
      {#if p.subtitle}<p class="slex-section-subtitle">{text(p.subtitle)}</p>{/if}
      {#if p.actionLabel}<a href={text(p.actionHref, "#")} class="slex-section-action">{text(p.actionLabel)}</a>{/if}
    </header>
  {/if}
  <div class="slex-section-body" use:renderChildren={ctx}></div>
</section>
