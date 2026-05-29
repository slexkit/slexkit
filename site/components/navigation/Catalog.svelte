<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { catalogGroups, emit, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<nav class="slex-catalog" aria-label={text(p.label, "Catalog")}>
  {#if p.hideHeader !== true}
    <div class="slex-catalog-header">
      <span class="slex-catalog-label">{text(p.label, "Catalog")}</span>
      {#if p.countLabel}<span class="slex-catalog-count">{text(p.countLabel)}</span>{/if}
    </div>
  {/if}
  <div class="slex-catalog-list">
    {#each catalogGroups(p.items) as group}
      <section class="slex-catalog-section" aria-label={group.label}>
        <div class="slex-catalog-group">
          <span>{group.label}</span>
          <span class="slex-catalog-group-count">{group.items.length}</span>
        </div>
        <div class="slex-catalog-section-list">
          {#each group.items as item}
            {@const id = text(item.id ?? item.slug)}
            {@const href = text(item.href, `/components/${encodeURIComponent(id)}`)}
            {@const selected = p.active === id || p.active === href}
            <a class="slex-catalog-item" class:slex-catalog-item--active={selected} href={href} aria-current={selected ? "page" : undefined} title={text(item.description ?? item.summary ?? item.title)} onclick={(event) => { if (p.preventDefault === true) event.preventDefault(); emit(ctx, "select", { type: "select", target: ctx.id, id, href, item, native: event }); }}>
              <span class="slex-catalog-title">{text(item.title ?? id)}</span>
              {#if item.status}<span class="slex-catalog-status">{text(item.status)}</span>{/if}
            </a>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</nav>
