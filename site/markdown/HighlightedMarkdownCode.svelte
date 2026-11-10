<script lang="ts">
  import Highlight from "svelte-highlight/Highlight.svelte";
  import HighlightSvelte from "svelte-highlight/HighlightSvelte.svelte";
  import bash from "svelte-highlight/languages/bash";
  import css from "svelte-highlight/languages/css";
  import javascript from "svelte-highlight/languages/javascript";
  import json from "svelte-highlight/languages/json";
  import markdown from "svelte-highlight/languages/markdown";
  import python from "svelte-highlight/languages/python";
  import sql from "svelte-highlight/languages/sql";
  import typescript from "svelte-highlight/languages/typescript";
  import xml from "svelte-highlight/languages/xml";
  import yaml from "svelte-highlight/languages/yaml";
  import type { LanguageType } from "svelte-highlight/languages";

  type Props = {
    lang?: string;
    text?: string;
    className?: string;
  };

  const languages: Record<string, LanguageType<string>> = {
    bash,
    css,
    javascript,
    json,
    markdown,
    python,
    sql,
    typescript,
    xml,
    yaml,
  };

  const aliases: Record<string, string> = {
    cjs: "javascript",
    html: "xml",
    js: "javascript",
    jsx: "javascript",
    md: "markdown",
    mjs: "javascript",
    py: "python",
    sh: "bash",
    shell: "bash",
    slex: "slex",
    ts: "typescript",
    tsx: "typescript",
    yml: "yaml",
  };

  let { lang = "", text = "", className = "" }: Props = $props();

  const languageName = $derived(normalizeLanguage(lang));
  const language = $derived(languageName === "slex" ? xml : languages[languageName]);
  const highlightedMarkdown = $derived(languageName === "markdown" ? highlightMarkdownSlexFences(text) : "");
  const blockClass = $derived([
    "slex-markdown-code",
    languageName ? `language-${languageName}` : "",
    className,
  ].filter(Boolean).join(" "));

  function normalizeLanguage(value: string): string {
    const [language = ""] = String(value ?? "").trim().toLowerCase().split(/\s+/, 1);
    return aliases[language] ?? language;
  }

  function highlightMarkdownSlexFences(source: string): string {
    const fencePattern = /(```+)(slex)([^\n]*)(\r?\n)([\s\S]*?)(\r?\n\1)/gi;
    let result = "";
    let lastIndex = 0;

    for (const match of source.matchAll(fencePattern)) {
      result += escapeHtml(source.slice(lastIndex, match.index));
      result += `<span class="hljs-section">${escapeHtml(match[1])}</span><span class="hljs-keyword">${escapeHtml(match[2])}</span>${escapeHtml(match[3])}${escapeHtml(match[4])}`;
      result += highlightSlexSource(match[5]);
      result += `<span class="hljs-section">${escapeHtml(match[6])}</span>`;
      lastIndex = (match.index ?? 0) + match[0].length;
    }

    result += escapeHtml(source.slice(lastIndex));
    return result;
  }

  function highlightSlexSource(source: string): string {
    return escapeHtml(source);
  }

  function escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
</script>

{#if languageName === "svelte"}
  <HighlightSvelte code={text} class={blockClass} />
{:else if languageName === "markdown" && /```+slex/i.test(text)}
  <pre class={blockClass}><code class="hljs language-markdown">{@html highlightedMarkdown}</code></pre>
{:else if language}
  <Highlight {language} code={text} class={blockClass} />
{:else}
  <pre class={blockClass}><code>{text}</code></pre>
{/if}
