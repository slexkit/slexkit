import { Marked } from "marked";
import { normalizeHeadingAnchors } from "../markdown/headings.js";
import { specBlockPattern } from "../markdown/directives.js";

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripSpecDirectives(md: string): string {
  return md.replace(specBlockPattern, "");
}

function replaceSlexFences(md: string): { processed: string; count: number } {
  let count = 0;
  const fencePattern = /```slex(?:\s+[^\n]*)?\n([\s\S]*?)```/g;
  const processed = md.replace(fencePattern, (_match, code: string) => {
    count++;
    const trimmed = code.trim();
    const encoded = Buffer.from(trimmed).toString("base64");
    return `<div class="slex-prerender-placeholder" data-slex-source="${encoded}"><pre><code class="language-slex">${escapeHtml(trimmed)}</code></pre></div>`;
  });
  return { processed, count };
}

function protectKatex(md: string): string {
  const placeholders = new Map<string, string>();
  let idx = 0;
  const nextId = () => `__KATEX_${idx++}__`;

  let result = md.replace(/\\\[[\s\S]*?\\\]/g, (m) => {
    const id = nextId();
    placeholders.set(id, `<div class="katex-display">${escapeHtml(m)}</div>`);
    return id;
  });

  result = result.replace(/\$\$[\s\S]*?\$\$/g, (m) => {
    const id = nextId();
    placeholders.set(id, `<div class="katex-display">${escapeHtml(m)}</div>`);
    return id;
  });

  result = result.replace(/\\\([\s\S]*?\\\)/g, (m) => {
    const id = nextId();
    placeholders.set(id, `<span class="katex-inline">${escapeHtml(m)}</span>`);
    return id;
  });

  return { result, placeholders } as any;
}

function restoreKatex(html: string, placeholders: Map<string, string>): string {
  let result = html;
  for (const [id, replacement] of placeholders) {
    result = result.replace(id, replacement);
  }
  return result;
}

export function prerenderMarkdown(rawMarkdown: string): { html: string } {
  const withoutDirectives = stripSpecDirectives(rawMarkdown);
  const { processed } = replaceSlexFences(withoutDirectives);
  const withAnchors = normalizeHeadingAnchors(processed);

  const katexPlaceholders = new Map<string, string>();
  let katexIdx = 0;
  const katexId = () => `__KATEX_${katexIdx++}__`;

  let protected_ = withAnchors.replace(/\\\[[\s\S]*?\\\]/g, (m) => {
    const id = katexId();
    katexPlaceholders.set(id, `<div class="katex-display">${escapeHtml(m)}</div>`);
    return id;
  });

  protected_ = protected_.replace(/\$\$[\s\S]*?\$\$/g, (m) => {
    const id = katexId();
    katexPlaceholders.set(id, `<div class="katex-display">${escapeHtml(m)}</div>`);
    return id;
  });

  protected_ = protected_.replace(/\\\([\s\S]*?\\\)/g, (m) => {
    const id = katexId();
    katexPlaceholders.set(id, `<span class="katex-inline">${escapeHtml(m)}</span>`);
    return id;
  });

  const marked = new Marked();
  let html = marked.parse(protected_) as string;

  for (const [id, replacement] of katexPlaceholders) {
    html = html.replace(id, replacement);
  }

  return { html };
}
