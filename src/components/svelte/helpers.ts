import type { RenderContext } from "../../engine/types";

type Item = {
  label?: string;
  value?: string;
  content?: string;
  description?: string;
  disabled?: boolean;
  [key: string]: unknown;
};

export function formatDisplayNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return "0";

  const rounded = Number(value.toPrecision(15));
  if (Object.is(rounded, -0)) return "0";

  return String(rounded);
}

export function text(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return formatDisplayNumber(value);
  return String(value);
}

export function label(ctx: RenderContext, key: string, value: unknown, fallback = ""): string {
  return text(value ?? ctx.labels[key], fallback);
}

export function bool(value: unknown): boolean {
  return value === true || value === "true";
}

export function list(value: unknown): Item[] {
  return Array.isArray(value) ? (value as Item[]) : [];
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

export function readColumns(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") return text((item as Record<string, unknown>).key);
    return "";
  }).filter(Boolean);
}

export function readColumnLabel(column: unknown, fallback: string): string {
  if (column && typeof column === "object") {
    const record = column as Record<string, unknown>;
    return text(record.label ?? record.key ?? fallback);
  }
  return text(column, fallback);
}

export function readCell(row: unknown, column: string): string {
  if (row && typeof row === "object") return text((row as Record<string, unknown>)[column]);
  return text(row);
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

function formatScriptKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

export function formatScriptValue(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  const nextPad = " ".repeat(indent + 2);
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "function") return value.toString();
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${nextPad}${formatScriptValue(item, indent + 2)}`).join(",\n")}\n${pad}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return `{\n${entries.map(([key, item]) => `${nextPad}${formatScriptKey(key)}: ${formatScriptValue(item, indent + 2)}`).join(",\n")}\n${pad}}`;
  }
  return "undefined";
}

export function stringifySource(source: unknown): string {
  if (typeof source === "string") return source;
  if (source && typeof source === "object") return formatScriptValue(source);
  return '{\n  slex: "0.1",\n  namespace: "playground_empty",\n  g: {},\n  layout: {}\n}';
}
