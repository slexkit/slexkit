<script module lang="ts">
  type ManagedTile = { column: string; marker: string | null; applied: string };
  // A native child may move between rows before either observer is delivered.
  const tileOwners = new WeakMap<HTMLElement, ManagedTile>();
</script>

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
    if (children.every((child) => child.localName === "slex-stat" || child.classList.contains("slex-stat"))) return "stat";
    if (children.every((child) => child.localName === "slex-card" || child.classList.contains("slex-card"))) return "card";
    return null;
  }

  function numericStyle(value: string, fallback: number): number {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function renderBalancedChildren(node: HTMLElement, options: RowRenderOptions) {
    const children = renderChildren(node, ctx);
    const owner = node.ownerDocument.defaultView!;
    let current = options;
    let pending = false;
    let active = true;
    let frame: number | undefined;
    let timer: number | undefined;
    const managed = new Map<HTMLElement, ManagedTile>();

    const release = (child: HTMLElement) => {
      const previous = managed.get(child);
      if (!previous) return;
      managed.delete(child);
      if (tileOwners.get(child) !== previous) return;
      tileOwners.delete(child);
      if (child.style.gridColumn === previous.applied) child.style.gridColumn = previous.column;
      if (previous.marker === null) child.removeAttribute("data-slex-balanced-tile");
      else child.setAttribute("data-slex-balanced-tile", previous.marker);
    };

    const reset = () => {
      node.classList.remove("slex-row--balanced-tiles");
      node.removeAttribute("data-tile-kind");
      node.style.removeProperty("--slex-balanced-cols");
      node.style.removeProperty("--slex-balanced-tracks");
      for (const child of managed.keys()) release(child);
    };

    const rebalance = () => {
      pending = false;
      if (!active) return;

      // Native slots keep authored nodes in the light DOM. Inspect the assigned
      // nodes instead of the slot element; never move or recreate the children.
      const projected = Array.from(node.childNodes).flatMap((child) =>
        child instanceof owner.HTMLSlotElement ? child.assignedNodes({ flatten: true }) : [child],
      );
      const hasText = projected.some((child) => child.nodeType === 3 && child.textContent?.trim());
      const directChildren = projected.filter((child): child is HTMLElement =>
        child instanceof owner.HTMLElement && !child.hidden && owner.getComputedStyle(child).display !== "none",
      );
      const kind = tileKind(directChildren);
      if (current.disabled || hasText || !kind) { reset(); return; }

      const styles = owner.getComputedStyle(node);
      const gap = numericStyle(styles.columnGap || styles.gap, 16);
      const targetTileWidth = numericStyle(styles.getPropertyValue("--slex-balanced-tile-width"), 136);
      const width = node.clientWidth || Number.parseFloat(styles.width);
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
      for (const child of managed.keys()) {
        if (!directChildren.includes(child)) release(child);
      }
      directChildren.forEach((child, index) => {
        const previous = tileOwners.get(child);
        if (previous && child.style.gridColumn !== previous.applied) previous.column = child.style.gridColumn;
        if (!managed.has(child) || managed.get(child) !== previous) {
          const state = {
            column: previous?.column ?? child.style.gridColumn,
            marker: previous ? previous.marker : child.getAttribute("data-slex-balanced-tile"),
            applied: "",
          };
          managed.set(child, state);
          tileOwners.set(child, state);
        }
        const column = `span ${layout.spans[index]}`;
        managed.get(child)!.applied = column;
        if (child.style.gridColumn !== column) child.style.gridColumn = column;
        if (child.getAttribute("data-slex-balanced-tile") !== kind) child.setAttribute("data-slex-balanced-tile", kind);
      });
    };

    const schedule = () => {
      if (!active || pending) return;
      pending = true;
      const flush = () => {
        if (frame !== undefined) owner.cancelAnimationFrame(frame);
        if (timer !== undefined) owner.clearTimeout(timer);
        frame = timer = undefined;
        rebalance();
      };
      frame = owner.requestAnimationFrame(flush);
      timer = owner.setTimeout(flush, 50);
    };

    const resizeObserver = new owner.ResizeObserver(schedule);
    resizeObserver.observe(node);
    const mutationObserver = new owner.MutationObserver(schedule);
    mutationObserver.observe(node, { childList: true });
    const host = (node.getRootNode() as ShadowRoot).host;
    if (host) mutationObserver.observe(host, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["hidden", "class", "style", "data-slex-balanced-tile"],
    });
    node.addEventListener("slotchange", schedule);
    schedule();

    return {
      update(next: RowRenderOptions) {
        current = next;
        schedule();
      },
      destroy() {
        active = false;
        if (frame !== undefined) owner.cancelAnimationFrame(frame);
        if (timer !== undefined) owner.clearTimeout(timer);
        node.removeEventListener("slotchange", schedule);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        reset();
        children.destroy();
      },
    };
  }
</script>

<div
  class={`slex-row${p.class ? ` ${text(p.class)}` : ""}`}
  id={p.id ? text(p.id) : undefined}
  data-variant={p.variant || p.presentation ? text(p.variant ?? p.presentation) : undefined}
  style:align-items={text(p.align, "stretch")}
  style:justify-content={text(p.justify)}
  style:gap={text(p.gap)}
  use:renderBalancedChildren={{ disabled: !!(p.align || p.justify) }}
></div>
