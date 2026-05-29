<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, objects, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<nav class="slex-toc" data-orientation={p.orientation === "horizontal" ? "horizontal" : "vertical"} aria-label={text(p.label, "Contents")}>
  {#if p.label}<div class="slex-toc-label">{text(p.label)}</div>{/if}
  <div class="slex-toc-list">
    {#each objects(p.items) as item}
      {@const href = text(item.href ?? item.id)}
      {@const normalizedHref = href.startsWith("#") || href.startsWith("/") ? href : `#${href}`}
      {@const isActive = p.active === normalizedHref || p.active === normalizedHref.replace(/^#/, "")}
      <a class="slex-toc-link" class:slex-toc-link--active={isActive} href={normalizedHref} aria-current={isActive ? "true" : undefined} onclick={(event) => emit(ctx, "click", { type: "click", target: ctx.id, href: normalizedHref, native: event })}>{text(item.label ?? item.title ?? normalizedHref.replace(/^#/, ""))}</a>
    {/each}
  </div>
</nav>

