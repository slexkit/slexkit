<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";
  import { chooseBalancedColumns, createBalancedTileLayout } from "./balancedTiles";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  type RowRenderOptions = {
    disabled: boolean;
  };

  function tileKind(children: Element[]): "stat" | "card" | null {
    if (children.length < 2) return null;
    if (children.every((child) => child.classList.contains("slex-stat"))) return "stat";
    if (children.every((child) => child.classList.contains("slex-card"))) return "card";
    return null;
  }

  function numericStyle(value: string, fallback: number): number {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function renderBalancedChildren(node: HTMLElement, options: RowRenderOptions) {
    const children = renderChildren(node, ctx);
    let current = options;
    let pending = false;

    const reset = () => {
      node.classList.remove("slex-row--balanced-tiles");
      node.removeAttribute("data-tile-kind");
      node.style.removeProperty("--slex-balanced-cols");
      node.style.removeProperty("--slex-balanced-tracks");
      for (const child of Array.from(node.children)) {
        if (child instanceof HTMLElement) child.style.removeProperty("grid-column");
      }
    };

    const rebalance = () => {
      pending = false;
      reset();
      if (current.disabled) return;

      const directChildren = Array.from(node.children);
      const kind = tileKind(directChildren);
      if (!kind) return;

      const styles = getComputedStyle(node);
      const gap = numericStyle(styles.columnGap || styles.gap, 16);
      const targetTileWidth = numericStyle(styles.getPropertyValue("--slex-balanced-tile-width"), 136);
      const width = node.getBoundingClientRect().width || node.clientWidth;
      const columns = chooseBalancedColumns({
        itemCount: directChildren.length,
        containerWidth: width,
        targetTileWidth,
        gap,
      });

      const layout = createBalancedTileLayout(directChildren.length, columns);
      node.classList.add("slex-row--balanced-tiles");
      node.dataset.tileKind = kind;
      node.style.setProperty("--slex-balanced-cols", String(layout.columns));
      node.style.setProperty("--slex-balanced-tracks", String(layout.tracks));
      directChildren.forEach((child, index) => {
        if (child instanceof HTMLElement) child.style.gridColumn = `span ${layout.spans[index]}`;
      });
    };

    const schedule = () => {
      if (pending) return;
      pending = true;
      queueMicrotask(rebalance);
    };

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(node);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(node, { childList: true });
    schedule();

    return {
      update(next: RowRenderOptions) {
        current = next;
        schedule();
      },
      destroy() {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        children.destroy();
      },
    };
  }
</script>

<div
  class={`slex-row${p.class ? ` ${text(p.class)}` : ""}`}
  id={p.id ? text(p.id) : undefined}
  data-variant={p.variant || p.presentation ? text(p.variant ?? p.presentation) : undefined}
  style:align-items={text(p.align)}
  style:justify-content={text(p.justify)}
  style:gap={text(p.gap)}
  use:renderBalancedChildren={{ disabled: !!(p.align || p.justify) }}
></div>
