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

/** Block executable link schemes while retaining host-specific document URLs. */
export function linkHref(value: unknown): string {
  const href = text(value, "#");
  const normalized = href.replace(/[\u0000-\u0020\u007f]/g, "").toLowerCase();
  return /^(?:javascript|vbscript|data):/.test(normalized) ? "#" : href;
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

export function readCell(row: unknown, column: string, index?: number): string {
  if (Array.isArray(row)) return text(typeof index === "number" ? row[index] : undefined);
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
  if (ctx.registerChildTarget) {
    ctx.registerChildTarget(node);
    return { destroy() { ctx.releaseChildTarget?.(node); node.replaceChildren(); } };
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

export type ScheduledFrame = {
  kind: "api" | "native" | "microtask";
  id?: unknown;
  canceled: boolean;
};

export function scheduleFrame(ctx: RenderContext, fn: (time?: number) => void): ScheduledFrame {
  const handle: ScheduledFrame = { kind: "microtask", canceled: false };
  const run = (time?: number) => {
    if (!handle.canceled) fn(time);
  };
  const apiRaf = ctx.api?.raf;
  if (typeof apiRaf === "function") {
    try {
      handle.kind = "api";
      handle.id = apiRaf(run);
      return handle;
    } catch {
      handle.kind = "microtask";
      handle.id = undefined;
    }
  }

  const ownerWindow = ctx.document.defaultView;
  if (ownerWindow && typeof ownerWindow.requestAnimationFrame === "function") {
    try {
      handle.kind = "native";
      handle.id = ownerWindow.requestAnimationFrame(run);
      return handle;
    } catch {
      handle.kind = "microtask";
      handle.id = undefined;
    }
  }

  queueMicrotask(() => run());
  return handle;
}

export function cancelScheduledFrame(ctx: RenderContext, handle: ScheduledFrame | undefined): void {
  if (!handle || handle.canceled) return;
  handle.canceled = true;
  if (handle.kind === "api" && typeof ctx.api?.cancelRaf === "function") {
    try {
      ctx.api.cancelRaf(handle.id);
    } catch {
      // The runtime may already be disposed; cancellation is best effort.
    }
  } else if (handle.kind === "native" && typeof handle.id === "number") {
    ctx.document.defaultView?.cancelAnimationFrame(handle.id);
  }
}
