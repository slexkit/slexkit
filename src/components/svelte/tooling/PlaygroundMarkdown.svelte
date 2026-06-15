<script lang="ts">
  import SvelteMarkdown from "../../../../node_modules/@humanspeak/svelte-markdown/dist/index.js";
  import { KatexRenderer, markedKatex } from "../../../../node_modules/@humanspeak/svelte-markdown/dist/extensions/index.js";
  import PlaygroundSlexCode from "./PlaygroundSlexCode.svelte";

  type Props = {
    content: string;
    domain?: string;
  };

  let { content, domain }: Props = $props();

  const extensions = [markedKatex({ singleDollarInline: true })];
  const renderers = {
    inlineKatex: KatexRenderer,
    blockKatex: KatexRenderer,
  };
  const options = { headerIds: false };

  function stripFrontmatter(value: string) {
    const raw = String(value ?? "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    if (!raw.startsWith("---")) return raw;

    const end = raw.indexOf("\n---", 3);
    if (end === -1) return raw;

    const closeEnd = raw.indexOf("\n", end + 1);
    return raw.slice(closeEnd === -1 ? raw.length : closeEnd + 1).trimStart();
  }

  function escapeHtml(value: string) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stripInlineMarkdown(value: string) {
    return String(value)
      .replace(/\s+\{#[A-Za-z0-9_-]+\}\s*$/, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+#+\s*$/, "")
      .trim();
  }

  function slugText(value: string) {
    const slug = String(value)
      .toLowerCase()
      .replace(/[`"'\u2018\u2019\u201c\u201d]/g, "")
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "section";
  }

  function createHeadingIdGenerator() {
    const counts = new Map<string, number>();
    return (rawTitle: string) => {
      const explicit = rawTitle.match(/\s+\{#([A-Za-z0-9_-]+)\}\s*$/)?.[1] ?? "";
      const base = explicit || slugText(stripInlineMarkdown(rawTitle));
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      return count ? `${base}-${count + 1}` : base;
    };
  }

  function normalizeHeadingAnchors(markdown: string) {
    const nextId = createHeadingIdGenerator();
    let fence: { char: string; length: number } | null = null;

    return String(markdown ?? "")
      .split(/\n/)
      .map((line) => {
        const marker = String(line).match(/^[ \t]{0,3}(`{3,}|~{3,})/);
        if (fence) {
          if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
          return line;
        }
        if (marker) {
          fence = { char: marker[1][0], length: marker[1].length };
          return line;
        }

        const heading = String(line).match(/^(#{1,6})[ \t]+(.+)$/);
        if (!heading) return line;
        const rawTitle = heading[2].replace(/\s+#+\s*$/, "");
        const renderedTitle = rawTitle.replace(/\s+\{#[A-Za-z0-9_-]+\}\s*$/, "").trim();
        return `<span id="${escapeHtml(nextId(rawTitle))}" class="slex-doc-heading-anchor"></span>\n${heading[1]} ${renderedTitle}`;
      })
      .join("\n");
  }

  function previewMarkdown(value: string) {
    return normalizeHeadingAnchors(stripFrontmatter(value));
  }
</script>

<div class="slex-doc-prose slex-doc-streamdown">
  <SvelteMarkdown source={previewMarkdown(content)} {extensions} {renderers} {options}>
    {#snippet code({ lang, text })}
      <PlaygroundSlexCode {lang} {text} {domain} />
    {/snippet}
  </SvelteMarkdown>
</div>
