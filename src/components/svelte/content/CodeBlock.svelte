<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  type CodeToken = {
    text: string;
    kind?: "comment" | "keyword" | "literal" | "number" | "string";
  };

  const supportedLanguages = new Set([
    "bash",
    "css",
    "html",
    "javascript",
    "js",
    "json",
    "markdown",
    "md",
    "python",
    "py",
    "sh",
    "shell",
    "sql",
    "ts",
    "tsx",
    "typescript",
    "xml",
    "yaml",
    "yml",
  ]);

  const keywordLanguages = new Set(["javascript", "js", "ts", "tsx", "typescript"]);
  const keywords = new Set([
    "as",
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "default",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "from",
    "function",
    "if",
    "import",
    "in",
    "interface",
    "let",
    "new",
    "of",
    "return",
    "switch",
    "throw",
    "try",
    "type",
    "var",
    "while",
  ]);
  const literals = new Set(["false", "null", "true", "undefined"]);
  const tokenPattern = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\r\n|\r|\n|\b\d+(?:\.\d+)?\b|\b[$A-Z_a-z][$\w]*\b|./g;

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let code = $derived(text(p.code ?? p.content ?? p.source));
  let languageName = $derived(text(p.language).trim().toLowerCase());
  let languageClass = $derived(languageName === "js" ? "javascript" : languageName || "");
  let lines = $derived(highlightCode(code, languageName) ?? plainCodeLines(code));
  let highlighted = $derived(supportedLanguages.has(languageName));
  let showLineNumbers = $derived(p.lineNumbers !== false && p.lineNumbers !== "false");
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function highlightCode(source: string, language: string): CodeToken[][] | null {
    if (!supportedLanguages.has(language)) return null;

    const tokens = Array.from(source.matchAll(tokenPattern), ([value]) => {
      if (value.startsWith("//") || value.startsWith("/*")) return { text: value, kind: "comment" };
      if (/^["'`]/.test(value)) return { text: value, kind: "string" };
      if (/^\d/.test(value)) return { text: value, kind: "number" };
      if (literals.has(value)) return { text: value, kind: "literal" };
      if (keywordLanguages.has(language) && keywords.has(value)) return { text: value, kind: "keyword" };
      return { text: value };
    });
    return splitTokenLines(tokens);
  }

  function plainCodeLines(source: string): CodeToken[][] {
    return splitTokenLines([{ text: source }]);
  }

  function splitTokenLines(tokens: CodeToken[]): CodeToken[][] {
    const lines: CodeToken[][] = [[]];
    for (const token of tokens) {
      for (const part of token.text.split(/(\r\n|\r|\n)/)) {
        if (!part) continue;
        if (part === "\n" || part === "\r" || part === "\r\n") {
          lines.push([]);
        } else {
          lines[lines.length - 1].push({ ...token, text: part });
        }
      }
    }
    return lines;
  }
</script>

<figure class="slex-code-block">
  {#if p.title || p.language || p.icon}
    <figcaption class="slex-code-block-header">
      <span class="slex-code-block-title">
        {#if p.icon}<InlineIcon name={p.icon} className="slex-code-block-icon" />{/if}
        {#if p.title}<span>{text(p.title)}</span>{/if}
      </span>
      {#if p.language}<span class="slex-code-block-language">{text(p.language)}</span>{/if}
    </figcaption>
  {/if}
  <pre class="slex-code-block-pre"><code
    class={`${highlighted ? "slex-code-highlight" : ""} slex-code-lines${p.language ? ` language-${highlighted ? languageClass : text(p.language)}` : ""}`.trim()}
    data-line-numbers={showLineNumbers ? "true" : "false"}
  >{#each lines as line}<span class="slex-code-line"><span class="slex-code-line-content">{#each line as token}{#if token.kind}<span class={`slex-code-token slex-code-token--${token.kind}`}>{token.text}</span>{:else}{token.text}{/if}{/each}</span></span>{/each}</code></pre>
</figure>
