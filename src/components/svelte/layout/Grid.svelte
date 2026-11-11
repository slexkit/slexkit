<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function colValue(value: unknown, fallback = 1): string {
    const n = Number(value ?? fallback);
    return Number.isFinite(n) ? String(n) : String(fallback);
  }

  function renderGridChildren(node: HTMLElement) {
    const children = renderChildren(node, ctx);
    const owner = node.ownerDocument.defaultView!;
    const managed = new Map<Element, { previous: string | null; applied: string }>();
    const release = (element: Element) => {
      const marker = managed.get(element);
      if (!marker) return;
      managed.delete(element);
      if (element.getAttribute("data-slex-balanced-tile") !== marker.applied) return;
      if (marker.previous === null) element.removeAttribute("data-slex-balanced-tile");
      else element.setAttribute("data-slex-balanced-tile", marker.previous);
    };
    const update = () => {
      const projected = Array.from(node.children).flatMap((child) =>
        child instanceof owner.HTMLSlotElement ? child.assignedElements({ flatten: true }) : [child],
      );
      const tiles = projected.filter((child) => child.localName === "slex-card" || child.localName === "slex-stat");
      for (const child of managed.keys()) if (!tiles.includes(child)) release(child);
      for (const child of tiles) {
        if (managed.has(child)) continue;
        const applied = child.localName === "slex-card" ? "card" : "stat";
        managed.set(child, { previous: child.getAttribute("data-slex-balanced-tile"), applied });
        child.setAttribute("data-slex-balanced-tile", applied);
      }
    };
    const observer = new owner.MutationObserver(update);
    const host = (node.getRootNode() as ShadowRoot).host;
    if (host) observer.observe(host, { childList: true });
    node.addEventListener("slotchange", update);
    update();
    return { destroy() { node.removeEventListener("slotchange", update); observer.disconnect(); for (const child of managed.keys()) release(child); children.destroy(); } };
  }
</script>

<div
  class={`slex-grid${p.class ? ` ${text(p.class)}` : ""}`}
  id={p.id ? text(p.id) : undefined}
  data-cols={colValue(p.columns)}
  data-cols-sm={p.smColumns === undefined ? undefined : colValue(p.smColumns, Number(p.columns ?? 1))}
  data-cols-md={colValue(p.mdColumns, Number(p.columns ?? 1))}
  data-cols-lg={p.lgColumns === undefined ? undefined : colValue(p.lgColumns, Number(p.mdColumns ?? p.columns ?? 1))}
  data-cols-xl={p.xlColumns === undefined ? undefined : colValue(p.xlColumns, Number(p.lgColumns ?? p.mdColumns ?? p.columns ?? 1))}
  style:gap={text(p.gap)}
  use:renderGridChildren
></div>
