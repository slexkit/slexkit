import { parse as parseJavaScript } from "acorn";
import { parseFragment, type DefaultTreeAdapterMap, type ParserError } from "parse5";
import type { HtmlInspectionResult, HtmlSourceDiagnostic, HtmlSourcePosition, HtmlValidationResult } from "./types";

type P5Node = DefaultTreeAdapterMap["node"] & {
  nodeName: string;
  tagName?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: P5Node[];
  content?: P5Node;
  value?: string;
  sourceCodeLocation?: P5Location;
};
type P5Location = {
  startOffset: number; endOffset: number; startLine: number; startCol: number; endLine: number; endCol: number;
  attrs?: Record<string, P5Location>; startTag?: P5Location; endTag?: P5Location;
};

const blockedElements = new Set(["iframe", "frame", "frameset", "object", "embed", "applet", "portal"]);
const urlAttributes = new Set(["href", "src", "action", "formaction", "poster", "xlink:href"]);
const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const optionalEnd = new Set(["html", "head", "body", "li", "dt", "dd", "p", "rt", "rp", "optgroup", "option", "colgroup", "thead", "tbody", "tfoot", "tr", "td", "th"]);

function position(offset: number, line: number, column: number): HtmlSourcePosition { return { offset, line, column }; }
function offsetPosition(source: string, offset: number): HtmlSourcePosition {
  const before = source.slice(0, offset);
  const lines = before.split(/\r\n?|\n/);
  return position(offset, lines.length, (lines.at(-1)?.length ?? 0) + 1);
}
function diagnostic(code: string, message: string, severity: "error" | "warning", location?: P5Location,
  relative?: { pos: number; loc: { line: number; column: number } }): HtmlSourceDiagnostic {
  if (!location) return { code, message, severity };
  if (relative) {
    const contentStart = location.startTag?.endOffset ?? location.startOffset;
    const contentLine = location.startTag?.endLine ?? location.startLine;
    const contentCol = location.startTag?.endCol ?? location.startCol;
    return { code, message, severity, start: position(contentStart + relative.pos,
      contentLine + relative.loc.line - 1, relative.loc.line === 1 ? contentCol + relative.loc.column : relative.loc.column + 1) };
  }
  return { code, message, severity, start: position(location.startOffset, location.startLine, location.startCol),
    end: position(location.endOffset, location.endLine, location.endCol) };
}

export function formatSlexKitDiagnostic(item: HtmlSourceDiagnostic): string {
  return `${item.code}: ${item.message}${item.start ? ` (${item.start.line}:${item.start.column})` : ""}`;
}
export class SlexKitSyntaxError extends SyntaxError {
  readonly code: string;
  readonly diagnostic: HtmlSourceDiagnostic;
  constructor(item: HtmlSourceDiagnostic) {
    super(formatSlexKitDiagnostic(item)); this.name = "SlexKitSyntaxError"; this.code = item.code; this.diagnostic = item;
  }
}
export class SlexKitRuntimeError extends Error {
  constructor(message: string) { super(message); this.name = "SlexKitRuntimeError"; }
}

function oldDslOffset(source: string): number | undefined {
  let offset = 0;
  while (offset < source.length) {
    const whitespace = /^[\s]+/.exec(source.slice(offset));
    if (whitespace) { offset += whitespace[0].length; continue; }
    if (source.startsWith("//", offset)) {
      const end = source.indexOf("\n", offset + 2); offset = end < 0 ? source.length : end + 1; continue;
    }
    if (source.startsWith("/*", offset)) {
      const end = source.indexOf("*/", offset + 2); if (end < 0) return undefined; offset = end + 2; continue;
    }
    break;
  }
  const candidate = source.slice(offset).trimEnd().replace(/;\s*$/, "");
  if (!candidate || !/^[({[]/.test(candidate)) return undefined;
  try {
    const program = parseJavaScript(`(${candidate})`, { ecmaVersion: "latest", sourceType: "module" }) as unknown as {
      body: Array<{ type: string; expression?: { type: string; elements?: Array<{ type?: string } | null> } }>;
    };
    const expression = program.body[0]?.expression;
    if (expression?.type === "ObjectExpression"
      || (expression?.type === "ArrayExpression" && expression.elements?.some(item => item?.type === "ObjectExpression"))) return offset;
  } catch { /* HTML or incomplete JavaScript is handled by the HTML parser. */ }
  return undefined;
}

function scriptText(node: P5Node): string {
  return (node.childNodes ?? []).filter(child => child.nodeName === "#text").map(child => child.value ?? "").join("");
}
function executableType(value: string | undefined): boolean {
  const type = (value ?? "module").trim().toLowerCase();
  return !type || type === "module" || /^(?:text|application)\/(?:java|ecma)script$/.test(type);
}
function unsafeUrl(value: string): boolean {
  const colon = value.indexOf(":");
  if (colon < 0) return false;
  const scheme = value.slice(0, colon).replace(/[\u0000-\u0020\u007f]+/g, "").toLowerCase();
  if (scheme === "javascript" || scheme === "vbscript") return true;
  if (scheme !== "data") return false;
  const header = value.slice(colon + 1, value.indexOf(",", colon + 1) < 0 ? undefined : value.indexOf(",", colon + 1))
    .replace(/[\u0000-\u0020\u007f]+/g, "").toLowerCase();
  return /^(?:text\/html|image\/svg\+xml|application\/(?:xhtml\+xml|javascript)|text\/javascript)(?:;|$)/.test(header);
}

function walk(node: P5Node, diagnostics: HtmlSourceDiagnostic[]): void {
  const tag = node.tagName?.toLowerCase();
  const attrs = node.attrs ?? [];
  const attr = (name: string) => attrs.find(item => item.name.toLowerCase() === name)?.value;
  if (tag && blockedElements.has(tag)) diagnostics.push(diagnostic("active-embedded-content", `<${tag}> is not allowed in SlexKit HTML.`, "error", node.sourceCodeLocation));
  if (tag === "base") diagnostics.push(diagnostic("base-element", "<base> is not allowed.", "error", node.sourceCodeLocation));
  if (tag === "meta" && (attr("http-equiv") ?? "").toLowerCase() === "refresh") diagnostics.push(diagnostic("meta-navigation", "Meta refresh navigation is not allowed.", "error", node.sourceCodeLocation));
  if (tag === "script" && attr("src") !== undefined) diagnostics.push(diagnostic("external-script", "External script src is not allowed.", "error", node.sourceCodeLocation));
  if (tag === "link" && /^(?:modulepreload|import|stylesheet)$/i.test(attr("rel") ?? "")) diagnostics.push(diagnostic("external-resource", "External link imports and stylesheets are not allowed.", "error", node.sourceCodeLocation));
  for (const item of attrs) {
    const name = item.name.toLowerCase();
    if (name.startsWith("$")) diagnostics.push(diagnostic("legacy-expression-attribute", "Slex expression attributes are no longer supported; use JavaScript properties and events.", "error", node.sourceCodeLocation?.attrs?.[item.name] ?? node.sourceCodeLocation));
    const location = node.sourceCodeLocation?.attrs?.[item.name] ?? node.sourceCodeLocation;
    if (/^on[a-z]/i.test(name)) diagnostics.push(diagnostic("inline-event-handler", `Inline event attribute '${item.name}' is not allowed.`, "error", location));
    if (urlAttributes.has(name) && unsafeUrl(item.value)) diagnostics.push(diagnostic("executable-url", `Executable URL in '${item.name}' is not allowed.`, "error", location));
  }
  if (tag && node.sourceCodeLocation?.startTag && !node.sourceCodeLocation.endTag && !voidElements.has(tag) && !optionalEnd.has(tag)) {
    diagnostics.push(diagnostic(tag === "script" && executableType(attr("type")) ? "incomplete-script" : "unclosed-html-element",
      tag === "script" ? "Inline script is incomplete; a closing </script> is required." : `<${tag}> has no explicit closing tag; the browser will recover it.`,
      tag === "script" && executableType(attr("type")) ? "error" : "warning", node.sourceCodeLocation.startTag));
  }
  if (tag === "script" && attr("src") === undefined && executableType(attr("type"))) {
    try {
      const program = parseJavaScript(scriptText(node), { ecmaVersion: "latest", sourceType: "module", locations: true });
      const visit = (value: unknown): void => {
        if (!value || typeof value !== "object") return;
        const record = value as Record<string, unknown>;
        if (record.type === "ImportDeclaration" || record.type === "ImportExpression"
          || ((record.type === "ExportNamedDeclaration" || record.type === "ExportAllDeclaration") && record.source)) {
          const loc = record.loc as { start: { line: number; column: number } };
          diagnostics.push(diagnostic("external-import", "Module imports and re-exports are not allowed.", "error", node.sourceCodeLocation,
            { pos: record.start as number, loc: loc.start })); return;
        }
        for (const child of Object.values(record)) {
          if (Array.isArray(child)) child.forEach(visit);
          else visit(child);
        }
      };
      visit(program);
    } catch (error) {
      const parseError = error as SyntaxError & { pos?: number; loc?: { line: number; column: number } };
      diagnostics.push(diagnostic("invalid-module-script", parseError.message.replace(/\s*\(\d+:\d+\)$/, ""), "error", node.sourceCodeLocation,
        parseError.pos !== undefined && parseError.loc ? { pos: parseError.pos, loc: parseError.loc } : undefined));
    }
  }
  for (const child of node.childNodes ?? []) walk(child, diagnostics);
  if (node.content) walk(node.content, diagnostics);
}

export function inspectSlexSource(source: unknown): HtmlInspectionResult {
  if (typeof source !== "string") {
    const item: HtmlSourceDiagnostic = { code: "source-type", message: "SlexKit HTML source must be a string.", severity: "error" };
    return { ok: false, diagnostic: item, diagnostics: [item], warnings: [], error: new TypeError(item.message) };
  }
  const legacyOffset = oldDslOffset(source);
  if (legacyOffset !== undefined) {
    const item: HtmlSourceDiagnostic = { code: "legacy-object-source", message: "Object-literal Slex source is no longer supported; provide an HTML fragment.", severity: "error", start: offsetPosition(source, legacyOffset) };
    return { ok: false, diagnostic: item, diagnostics: [item], warnings: [], error: new SlexKitSyntaxError(item) };
  }
  const parseErrors: ParserError[] = [];
  const document = parseFragment(source, { sourceCodeLocationInfo: true, onParseError: error => parseErrors.push(error) }) as P5Node;
  const diagnostics: HtmlSourceDiagnostic[] = parseErrors.map(error => ({ code: `html-${error.code}`, message: `HTML parser recovery: ${error.code}.`, severity: "warning",
    start: position(error.startOffset, error.startLine, error.startCol), end: position(error.endOffset, error.endLine, error.endCol) }));
  walk(document, diagnostics);
  // Avoid duplicate parser-recovery warnings when a more useful incomplete-script diagnostic exists.
  if (diagnostics.some(item => item.code === "incomplete-script")) {
    for (let index = diagnostics.length - 1; index >= 0; index--) if (diagnostics[index].code.includes("eof-in-element")) diagnostics.splice(index, 1);
  }
  const errors = diagnostics.filter(item => item.severity === "error");
  const warnings = diagnostics.filter(item => item.severity === "warning");
  if (errors.length) return { ok: false, diagnostic: errors[0], diagnostics, warnings, error: new SlexKitSyntaxError(errors[0]) };
  return { ok: true, value: source, diagnostics, warnings };
}

export const parseSlexSource = inspectSlexSource;
export function validateSlexSource(source: unknown): HtmlValidationResult {
  const result = inspectSlexSource(source);
  const diagnostics = result.diagnostics ?? (result.diagnostic ? [result.diagnostic] : []);
  const warnings = diagnostics.filter(item => item.severity === "warning");
  const errors = diagnostics.filter(item => item.severity === "error");
  return { ok: result.ok, valid: errors.length === 0, diagnostics, warnings, errors };
}
