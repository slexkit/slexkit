import { inspectSlexSource } from "../../src/html/inspect";
export { defaultPlaygroundSource } from "./home-playground.js";

export function normalizePlaygroundMode(value) {
  const mode = String(value ?? "").trim().toLowerCase();
  if (mode === "code" || mode === "editor") return "code";
  if (mode === "live" || mode === "split" || mode === "both") return "live";
  return "render";
}

export function analyzeSlexSource(source) {
  const blocks = Array.from(String(source).matchAll(/(```|~~~)slex(?:[ \t]+[^\n]*)?\n([\s\S]*?)\n\1/g), (match, index) => ({
    code: match[2],
    index: index + 1,
  }));
  const candidates = blocks.length ? blocks : [{ code: String(source), index: 1 }];
  for (const block of candidates) {
    const result = inspectSlexSource(block.code);
    if (!result.ok) return { ok: false, block: block.index, message: result.diagnostic?.message ?? String(result.error), diagnostic: result.diagnostic };
  }
  return { ok: true };
}

export const canParseSlexSource = (source) => analyzeSlexSource(source).ok;
export const analyzeSlexKitSource = analyzeSlexSource;
export const canParseSlexKitSource = canParseSlexSource;
