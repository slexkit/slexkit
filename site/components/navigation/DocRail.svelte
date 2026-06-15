<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { objects, text } from "../helpers";
  import { getPhosphorIcon } from "../../app/icons.js";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function tocItems() {
    const maxDepth = Number(p.maxDepth ?? 2);
    return objects(p.items ?? p.toc).filter((item) => Number(item.depth ?? 2) <= maxDepth);
  }

  function itemHref(item: Record<string, unknown>) {
    const href = text(item.href);
    if (href) return href;
    const id = text(item.id);
    return id ? `#${id}` : "#";
  }

  function itemLabel(item: Record<string, unknown>) {
    return text(item.label ?? item.title ?? item.id).replace(/^\s*\d+[.\u3001]\s*/, "");
  }

  function itemDepth(item: Record<string, unknown>) {
    return text(item.depth ?? 2);
  }

  function isActive(item: Record<string, unknown>) {
    const active = text(p.active);
    if (!active) return false;
    const href = itemHref(item);
    return active === href || active.replace(/^#/, "") === href.replace(/^#/, "");
  }

  function canCopy() {
    return typeof p.onCopy === "function";
  }

  function copyPage() {
    if (typeof p.onCopy === "function") p.onCopy();
  }

  function hasActions() {
    return canCopy() || Boolean(text(p.markdownHref)) || Boolean(text(p.playgroundHref ?? p.liveHref));
  }
</script>

<aside class={`slex-doc-detail-rail${p.class ? ` ${text(p.class)}` : ""}`}>
  {#if tocItems().length}
    <nav class="slex-doc-detail-toc" aria-label={text(p.ariaLabel, "本页目录")}>
      {#if p.label !== false}
        <div class="slex-doc-detail-rail-title">{text(p.label, "本页")}</div>
      {/if}
      {#each tocItems() as item}
        <a
          class={`slex-doc-detail-toc-link slex-doc-detail-toc-link--depth-${itemDepth(item)}`}
          class:slex-doc-detail-toc-link--active={isActive(item)}
          href={itemHref(item)}
          aria-current={isActive(item) ? "true" : undefined}
        >{itemLabel(item)}</a>
      {/each}
    </nav>
  {/if}
  {#if hasActions()}
    <div class="slex-doc-detail-actions slex-doc-detail-actions--rail" aria-label={text(p.actionsLabel, "文档")}>
      {#if canCopy()}
        <span class="slex-doc-detail-copy-action">
          <button type="button" class="slex-doc-detail-action" title={text(p.copyLabel, "复制页面")} onclick={copyPage}>
            <span class="slex-doc-detail-action-icon" aria-hidden="true">{@html getPhosphorIcon("copy")}</span>{text(p.copyLabel, "复制页面")}
          </button>
          <span class="slex-doc-detail-copy-feedback" data-state={text(p.copyFeedbackState, "success")} aria-live="polite">{text(p.copyFeedback)}</span>
        </span>
      {/if}
      {#if text(p.markdownHref)}
        <a class="slex-doc-detail-action" title={text(p.viewMarkdownLabel, "查看 Markdown")} href={text(p.markdownHref)} target="_blank" rel="noreferrer">
          <span class="slex-doc-detail-action-icon" aria-hidden="true">{@html getPhosphorIcon("markdown-logo")}</span>{text(p.markdownLabel, "Markdown")}
        </a>
      {/if}
      {#if text(p.playgroundHref ?? p.liveHref)}
        <a class="slex-doc-detail-action" title={text(p.openLiveLabel, "以 Live 模式打开")} href={text(p.playgroundHref ?? p.liveHref)} target="_blank" rel="noreferrer">
          <span class="slex-doc-detail-action-icon" aria-hidden="true">{@html getPhosphorIcon("square-split-horizontal")}</span>{text(p.openLiveLabel, "以 Live 模式打开")}
        </a>
      {/if}
    </div>
  {/if}
</aside>
