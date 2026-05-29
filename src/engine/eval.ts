import { batch, trackReactiveValue } from "./reactive";

const lastValues = new Map<string, unknown>();
export const SKIP_EAGER_TRACK = Symbol.for("slexkit.skipEagerTrack");
export const EAGER_TRACK_TARGET = Symbol.for("slexkit.eagerTrackTarget");

export function clearEvalCache(ns: string): void {
  const prefix = `${ns}:`;
  for (const key of Array.from(lastValues.keys())) {
    if (key.startsWith(prefix)) lastValues.delete(key);
  }
}

export function evalRead(
  expr: string,
  context: Record<string, unknown>,
  ns?: string,
  path?: string,
): unknown {
  try {
    for (const value of Object.values(context)) {
      if (
        value &&
        (typeof value === "object" || typeof value === "function") &&
        (value as Record<PropertyKey, unknown>)[SKIP_EAGER_TRACK]
      ) {
        continue;
      }
      const target =
        value &&
        (typeof value === "object" || typeof value === "function")
          ? ((value as Record<PropertyKey, unknown>)[EAGER_TRACK_TARGET] ?? value)
          : value;
      trackReactiveValue(target);
    }
    const revision = context.$revision;
    if (typeof revision === "function") revision();
    const keys = Object.keys(context);
    const vals = Object.values(context);
    const fn = new Function(...keys, `"use strict"; return (${expr});`);
    const result = fn(...vals);
    if (path !== undefined) lastValues.set(`${ns ?? "?"}:${path}:${expr}`, result);
    return result;
  } catch (e) {
    const cacheKey = path !== undefined ? `${ns ?? "?"}:${path}:${expr}` : expr;
    const last = lastValues.get(cacheKey);
    console.warn(
      `[SlexKit][${ns || "?"}] $eval error at ${path || "?"}:`,
      expr,
      (e as Error).message,
    );
    if (last !== undefined) return last;
    return undefined;
  }
}

export function execWrite(
  stmt: string,
  context: Record<string, unknown>,
  ns?: string,
  path?: string,
): void {
  try {
    const keys = Object.keys(context);
    const vals = Object.values(context);
    const fn = new Function(...keys, `"use strict"; { ${stmt} }`);
    batch(() => fn(...vals));
  } catch (e) {
    console.warn(
      `[SlexKit][${ns || "?"}] @exec error at ${path || "?"}:`,
      stmt,
      (e as Error).message,
    );
  }
}
