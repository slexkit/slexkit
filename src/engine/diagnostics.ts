export type SlexKitSourceDiagnostic = {
  code: "syntax";
  message: string;
  line: number;
  column: number;
  detail?: string;
  excerpt: string;
};

export type SlexKitParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: SlexKitSyntaxError; diagnostic: SlexKitSourceDiagnostic };

export type SlexStreamingMode = false | "stable" | "repair";

export type SlexStreamingRepair =
  | { kind: "string"; value: string; position: number }
  | { kind: "comment"; value: string; position: number }
  | { kind: "delimiter"; value: string; position: number; opener: string };

export type SlexStreamingParseResult =
  | { status: "complete"; source: string; value: unknown }
  | {
      status: "repaired";
      source: string;
      repairedSource: string;
      value: unknown;
      repairs: SlexStreamingRepair[];
      diagnostic: SlexKitSourceDiagnostic;
    }
  | { status: "pending"; source: string; diagnostic?: SlexKitSourceDiagnostic; repairs?: SlexStreamingRepair[] }
  | { status: "invalid"; source: string; error: SlexKitSyntaxError; diagnostic: SlexKitSourceDiagnostic };

export type SlexStreamingParseOptions = {
  mode?: SlexStreamingMode | true;
};

type Position = {
  line: number;
  column: number;
};

type LocatedChar = Position & {
  char: string;
  index: number;
};

type SourceScan = {
  chars: LocatedChar[];
  stack: LocatedChar[];
  openQuote?: string;
  escaped?: boolean;
  mismatchedDelimiter?: LocatedChar;
};

export class SlexKitSyntaxError extends SyntaxError {
  diagnostic: SlexKitSourceDiagnostic;

  constructor(diagnostic: SlexKitSourceDiagnostic) {
    super(formatSlexKitDiagnostic(diagnostic));
    this.name = "SlexKitSyntaxError";
    this.diagnostic = diagnostic;
  }
}

function excerpt(source: string, line: number, column: number): string {
  const lines = source.split("\n");
  const start = Math.max(1, line - 2);
  const end = Math.min(lines.length, line + 2);
  const width = String(end).length;
  const rows: string[] = [];

  for (let current = start; current <= end; current += 1) {
    const marker = current === line ? ">" : " ";
    rows.push(`${marker} ${String(current).padStart(width, " ")} | ${lines[current - 1] ?? ""}`);
    if (current === line) {
      rows.push(`  ${" ".repeat(width)} | ${" ".repeat(Math.max(0, column - 1))}^`);
    }
  }

  return rows.join("\n");
}

function lineColumnAt(source: string, index: number): Position {
  const prefix = source.slice(0, Math.max(0, index));
  const lines = prefix.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function stackLine(error: unknown): number | null {
  if (!(error instanceof Error) || !error.stack) return null;
  const match = error.stack.match(/<parse>\s+\(:(\d+)\)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? Math.max(1, parsed - 2) : null;
}

function scanSourceState(source: string): SourceScan {
  const chars: LocatedChar[] = [];
  const stack: LocatedChar[] = [];
  const pairs: Record<string, string> = { "}": "{", "]": "[", ")": "(" };
  let quote = "";
  let escaped = false;
  let line = 1;
  let column = 0;
  let mismatchedDelimiter: LocatedChar | undefined;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    column += 1;

    if (char === "\n") {
      line += 1;
      column = 0;
      if (quote === "//") quote = "";
      continue;
    }

    if (quote) {
      if (quote === "/*" && char === "*" && next === "/") {
        quote = "";
        index += 1;
        column += 1;
      } else if (quote !== "/*" && quote !== "//" && !escaped && char === quote) {
        quote = "";
      }
      escaped = !escaped && quote !== "/*" && quote !== "//" && char === "\\";
      if (char !== "\\") escaped = false;
      continue;
    }

    if (char === "/" && next === "/") {
      quote = "//";
      index += 1;
      column += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      quote = "/*";
      index += 1;
      column += 1;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      escaped = false;
      continue;
    }

    const located = { char, index, line, column };
    chars.push(located);

    if (char === "{" || char === "[" || char === "(") {
      stack.push(located);
    } else if (char === "}" || char === "]" || char === ")") {
      const expected = pairs[char];
      const opener = stack.pop();
      if (!opener || opener.char !== expected) {
        mismatchedDelimiter = located;
      }
    }
  }

  return {
    chars,
    stack,
    openQuote: quote || undefined,
    escaped,
    mismatchedDelimiter,
  };
}

function scanSource(source: string): LocatedChar[] {
  return scanSourceState(source).chars;
}

function tokenDiagnostic(source: string, message: string): Position | null {
  const chars = scanSource(source);

  const unexpectedString = message.match(/Unexpected string(?: literal)?(?: "([^"]+)")?/);
  if (unexpectedString) {
    const literal = unexpectedString[1];
    if (literal) {
      const quoted = [`"${literal}"`, `'${literal}'`, `\`${literal}\``];
      const index = quoted
        .map((candidate) => source.indexOf(candidate))
        .filter((candidate) => candidate >= 0)
        .sort((a, b) => a - b)[0];
      if (index !== undefined) return lineColumnAt(source, index);
    }

    const suspiciousString = source.match(/[}\])"']\s*(['"`])/);
    if (suspiciousString?.index !== undefined) {
      const quoteIndex = source.indexOf(suspiciousString[1], suspiciousString.index + 1);
      if (quoteIndex >= 0) return lineColumnAt(source, quoteIndex);
    }
  }

  if (message.includes("Unexpected token ':'")) {
    const doubleColon = chars.find((item, index) => item.char === ":" && chars[index - 1]?.char === ":");
    if (doubleColon) return doubleColon;

    const suspiciousColon = chars.find((item, index) => {
      if (item.char !== ":") return false;
      const prev = chars[index - 1]?.char;
      return prev === "\"" || prev === "'" || prev === "}" || prev === "]" || prev === ")";
    });
    if (suspiciousColon) return suspiciousColon;
  }

  return null;
}

function delimiterDiagnostic(source: string): (Position & { detail: string }) | null {
  const scan = scanSourceState(source);
  if (scan.mismatchedDelimiter) {
    return {
      line: scan.mismatchedDelimiter.line,
      column: scan.mismatchedDelimiter.column,
      detail: `Unexpected closing delimiter ${scan.mismatchedDelimiter.char}.`,
    };
  }

  const opener = scan.stack.at(-1);
  if (!opener) return null;
  const end = lineColumnAt(source, source.length);
  return {
    line: end.line,
    column: end.column,
    detail: `Expected closing delimiter for ${opener.char} opened at line ${opener.line}, column ${opener.column}.`,
  };
}

export function isLikelyIncompleteSlexSource(
  source: string,
  diagnostic?: Pick<SlexKitSourceDiagnostic, "message" | "detail">,
): boolean {
  if (source.trim().length === 0) return true;

  const scan = scanSourceState(source);
  if (scan.openQuote && scan.openQuote !== "//") return true;

  const delimiter = delimiterDiagnostic(source);
  if (delimiter?.detail.startsWith("Expected closing delimiter")) return true;

  const message = diagnostic?.message ?? "";
  if (/unexpected end of input|unterminated|missing\)|missing \}/i.test(message)) return true;

  return false;
}

function streamingMode(value: SlexStreamingParseOptions["mode"]): SlexStreamingMode {
  if (value === true || value === undefined) return "repair";
  return value;
}

function closingDelimiter(open: string): string {
  if (open === "{") return "}";
  if (open === "[") return "]";
  return ")";
}

function repairSlexStreamingSource(source: string): { source: string; repairs: SlexStreamingRepair[] } | null {
  const scan = scanSourceState(source);
  if (scan.mismatchedDelimiter) return null;
  if (scan.openQuote === "//") return null;
  if (scan.openQuote && scan.escaped) return null;

  const repairs: SlexStreamingRepair[] = [];
  let repairedSource = source;
  const position = source.length;

  if (scan.openQuote === "/*") {
    repairedSource += "*/";
    repairs.push({ kind: "comment", value: "*/", position });
  } else if (scan.openQuote) {
    repairedSource += scan.openQuote;
    repairs.push({ kind: "string", value: scan.openQuote, position });
  }

  for (let index = scan.stack.length - 1; index >= 0; index -= 1) {
    const opener = scan.stack[index];
    const value = closingDelimiter(opener.char);
    repairedSource += value;
    repairs.push({ kind: "delimiter", value, position: source.length, opener: opener.char });
  }

  if (repairs.length === 0) return null;
  return { source: repairedSource, repairs };
}

function locateSyntaxError(source: string, error: unknown): SlexKitSourceDiagnostic {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const delimiter = delimiterDiagnostic(source);
  const token = tokenDiagnostic(source, rawMessage);
  const stack = stackLine(error);
  const position = token
    ?? (delimiter && rawMessage.includes("Expected") ? delimiter : null)
    ?? (stack ? { line: stack, column: 1 } : null)
    ?? delimiter
    ?? { line: 1, column: 1 };

  const detail = token
    ? "The parser failed at this token."
    : delimiter?.detail;

  return {
    code: "syntax",
    message: rawMessage,
    line: position.line,
    column: position.column,
    detail,
    excerpt: excerpt(source, position.line, position.column),
  };
}

function readStringLiteral(source: string, start: number): { end: number; value: string } | null {
  const quote = source[start];
  if (quote !== "\"" && quote !== "'" && quote !== "`") return null;
  let escaped = false;
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    if (!escaped && char === quote) {
      return { end: index + 1, value: source.slice(start, index + 1) };
    }
    escaped = !escaped && char === "\\";
    if (char !== "\\") escaped = false;
  }
  return null;
}

function skipWhitespace(source: string, index: number): number {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
  return cursor;
}

function findExpressionEnd(source: string, start: number): number {
  const stack: string[] = [];
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (quote) {
      if (quote === "//" && char === "\n") {
        quote = "";
      } else if (quote === "/*" && char === "*" && next === "/") {
        quote = "";
        index += 1;
      } else if (quote !== "//" && quote !== "/*" && !escaped && char === quote) {
        quote = "";
      }
      escaped = !escaped && quote !== "//" && quote !== "/*" && char === "\\";
      if (char !== "\\") escaped = false;
      continue;
    }

    if (char === "/" && next === "/") {
      quote = "//";
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      quote = "/*";
      index += 1;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      escaped = false;
      continue;
    }

    if (char === "{" || char === "[" || char === "(") {
      stack.push(char);
      continue;
    }
    if (char === "}" || char === "]" || char === ")") {
      if (stack.length === 0) return index;
      stack.pop();
      continue;
    }
    if (char === "," && stack.length === 0) return index;
  }

  return source.length;
}

function isSingleStringLiteral(source: string): boolean {
  const start = skipWhitespace(source, 0);
  const literal = readStringLiteral(source, start);
  return Boolean(literal && skipWhitespace(source, literal.end) === source.length);
}

function transformDynamicPropExpressions(source: string): string {
  const edits: Array<{ start: number; end: number; value: string }> = [];
  const keyPattern = /(^|[,{]\s*)(\$[A-Za-z_$][\w$]*)\s*:/g;
  let match: RegExpExecArray | null;

  while ((match = keyPattern.exec(source))) {
    const colon = source.indexOf(":", match.index + match[1].length);
    const valueStart = skipWhitespace(source, colon + 1);
    const valueEnd = findExpressionEnd(source, valueStart);
    const rawValue = source.slice(valueStart, valueEnd);
    if (!rawValue.trim() || isSingleStringLiteral(rawValue)) continue;
    edits.push({
      start: valueStart,
      end: valueEnd,
      value: JSON.stringify(rawValue.trim()),
    });
  }

  if (edits.length === 0) return source;
  let transformed = source;
  for (let index = edits.length - 1; index >= 0; index -= 1) {
    const edit = edits[index];
    transformed = `${transformed.slice(0, edit.start)}${edit.value}${transformed.slice(edit.end)}`;
  }
  return transformed;
}

export function formatSlexKitDiagnostic(diagnostic: SlexKitSourceDiagnostic): string {
  const detail = diagnostic.detail ? `\n${diagnostic.detail}` : "";
  return `${diagnostic.message} at line ${diagnostic.line}, column ${diagnostic.column}.${detail}\n${diagnostic.excerpt}`;
}

export function diagnoseSlexKitSource(source: string, error: unknown): SlexKitSourceDiagnostic {
  return locateSyntaxError(source, error);
}

export function parseSlexSource(source: string): SlexKitParseResult {
  try {
    const parseSource = transformDynamicPropExpressions(source);
    return {
      ok: true,
      value: new Function(`"use strict";\nreturn (\n${parseSource}\n);`)(),
    };
  } catch (error) {
    const diagnostic = diagnoseSlexKitSource(source, error);
    return {
      ok: false,
      diagnostic,
      error: new SlexKitSyntaxError(diagnostic),
    };
  }
}

export function parseSlexStreamingSource(
  source: string,
  options: SlexStreamingParseOptions = {},
): SlexStreamingParseResult {
  const parsed = parseSlexSource(source);
  if (parsed.ok) {
    return {
      status: "complete",
      source,
      value: parsed.value,
    };
  }

  const mode = streamingMode(options.mode);
  const incomplete = isLikelyIncompleteSlexSource(source, parsed.diagnostic);
  if (mode === false) {
    return incomplete
      ? { status: "pending", source, diagnostic: parsed.diagnostic }
      : { status: "invalid", source, diagnostic: parsed.diagnostic, error: parsed.error };
  }

  if (mode === "stable") {
    return incomplete
      ? { status: "pending", source, diagnostic: parsed.diagnostic }
      : { status: "invalid", source, diagnostic: parsed.diagnostic, error: parsed.error };
  }

  if (!incomplete) {
    return {
      status: "invalid",
      source,
      diagnostic: parsed.diagnostic,
      error: parsed.error,
    };
  }

  const repaired = repairSlexStreamingSource(source);
  if (!repaired) {
    return { status: "pending", source, diagnostic: parsed.diagnostic };
  }

  const repairedParsed = parseSlexSource(repaired.source);
  if (repairedParsed.ok) {
    return {
      status: "repaired",
      source,
      repairedSource: repaired.source,
      value: repairedParsed.value,
      repairs: repaired.repairs,
      diagnostic: parsed.diagnostic,
    };
  }

  return {
    status: "pending",
    source,
    diagnostic: parsed.diagnostic,
    repairs: repaired.repairs,
  };
}

/** @deprecated Use parseSlexSource instead. */
export const parseSlexKitDsl = parseSlexSource;
