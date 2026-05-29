<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<section class="slex-hero" data-align={p.align === "center" ? "center" : "split"}>
  <div class="slex-hero-copy">
    {#if p.eyebrow}<div class="slex-hero-eyebrow">{text(p.eyebrow)}</div>{/if}
    {#if p.title}<h1 class="slex-hero-title">{text(p.title)}</h1>{/if}
    {#if p.subtitle}<p class="slex-hero-subtitle">{text(p.subtitle)}</p>{/if}
    {#if p.primaryLabel || p.secondaryLabel}
      <div class="slex-hero-actions">
        {#if p.primaryLabel}<a href={text(p.primaryHref, "#")} class="slex-hero-action slex-hero-action--primary">{text(p.primaryLabel)}</a>{/if}
        {#if p.secondaryLabel}<a href={text(p.secondaryHref, "#")} class="slex-hero-action slex-hero-action--secondary">{text(p.secondaryLabel)}</a>{/if}
      </div>
    {/if}
  </div>
  <div class="slex-hero-media" use:renderChildren={ctx}></div>
</section>
