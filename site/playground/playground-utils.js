import { parseSlexSource } from "../../dist/slexkit.js";
export { defaultPlaygroundSource } from "./home-playground.js";

export function normalizePlaygroundMode(value) {
  const mode = String(value ?? "").trim().toLowerCase();
  if (mode === "code" || mode === "script" || mode === "editor") return "code";
  if (mode === "render" || mode === "preview") return "render";
  if (mode === "live" || mode === "split" || mode === "both") return "live";
  return "render";
}

function lineAndColumnAt(source, index) {
  const prefix = source.slice(0, index);
  const lines = prefix.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function slexBlocks(source) {
  return Array.from(source.matchAll(/(```|~~~)slex\s*\n([\s\S]*?)\n\1/g), (match, index) => {
    const code = match[2];
    const startIndex = (match.index ?? 0) + match[0].indexOf(code);
    return {
      code,
      index: index + 1,
      startIndex,
      startLine: lineAndColumnAt(source, startIndex).line,
    };
  });
}

function looksLikeDirectSlexSource(source) {
  const text = String(source ?? "").trim();
  if (!text) return false;
  if (/^(```|~~~)/.test(text)) return false;
  if (!/^(?:export\s+default\s+)?\(?\s*\{/.test(text)) return false;
  return /["']?(slex|namespace|layout|g)["']?\s*:/.test(text);
}

export function analyzeSlexSource(source) {
  const blocks = slexBlocks(source);
  const candidates = blocks.length
    ? blocks
    : looksLikeDirectSlexSource(source)
      ? [{ code: source, index: 1, startIndex: 0, startLine: 1 }]
      : [];

  for (const block of candidates) {
    const code = block.code;
    if (!code.trim()) continue;
    const parsed = parseSlexSource(code);
    if (!parsed.ok) {
      const diagnostic = parsed.diagnostic;
      return {
        ok: false,
        block: block.index,
        message: diagnostic.message,
        line: diagnostic.line,
        column: diagnostic.column,
        editorLine: block.startLine + diagnostic.line - 1,
        detail: diagnostic.detail ?? "",
        code,
        excerpt: diagnostic.excerpt,
      };
    }
  }

  return { ok: true };
}

export function canParseSlexSource(source) {
  return analyzeSlexSource(source).ok;
}

export const analyzeSlexKitSource = analyzeSlexSource;
export const canParseSlexKitSource = canParseSlexSource;
