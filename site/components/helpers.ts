import type { RenderContext } from "../../src/engine/types";

type Item = {
  label?: string;
  value?: string;
  content?: string;
  description?: string;
  disabled?: boolean;
  [key: string]: unknown;
};

export function text(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export function rows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function objects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    : [];
}

export function itemLabel(item: unknown): string {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    return text(record.label ?? record.title ?? record.value ?? record.id);
  }
  return text(item);
}

export function itemDescription(item: unknown): string {
  return item && typeof item === "object" ? text((item as Record<string, unknown>).description) : "";
}

export function catalogItems(value: unknown): Record<string, unknown>[] {
  return objects(value).filter((item) => text(item.id ?? item.slug));
}

export function catalogGroups(value: unknown): Array<{ label: string; items: Record<string, unknown>[] }> {
  const groups: Array<{ label: string; items: Record<string, unknown>[] }> = [];
  const byLabel = new Map<string, { label: string; items: Record<string, unknown>[] }>();

  for (const item of catalogItems(value)) {
    const label = text(item.category, "Component");
    let group = byLabel.get(label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
      byLabel.set(label, group);
    }
    group.items.push(item);
  }

  return groups;
}

export function renderChildren(node: HTMLElement, ctx: RenderContext) {
  if (ctx.children && Object.keys(ctx.children).length > 0) {
    ctx.renderTree(ctx.children, node, ctx.forCtx);
  }
  return {
    destroy() {
      node.replaceChildren();
    },
  };
}

export function emit(ctx: RenderContext, event: string, data?: unknown): void {
  ctx.emit(event, data);
}
