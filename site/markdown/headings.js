function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripInlineMarkdown(value) {
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

function slugText(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[`"'\u2018\u2019\u201c\u201d]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

function extractExplicitHeadingId(value) {
  return String(value).match(/\s+\{#([A-Za-z0-9_-]+)\}\s*$/)?.[1] ?? "";
}

function headingFromLine(line) {
  const match = String(line).match(/^(#{1,6})[ \t]+(.+)$/);
  if (!match) return null;

  const rawTitle = match[2].replace(/\s+#+\s*$/, "");
  const title = stripInlineMarkdown(rawTitle);
  if (!title) return null;

  return {
    depth: match[1].length,
    hashes: match[1],
    rawTitle,
    title,
    explicitId: extractExplicitHeadingId(rawTitle),
    renderedTitle: rawTitle.replace(/\s+\{#[A-Za-z0-9_-]+\}\s*$/, "").trim(),
  };
}

function fenceMarker(line) {
  const match = String(line).match(/^[ \t]{0,3}(`{3,}|~{3,})/);
  if (!match) return null;
  return {
    char: match[1][0],
    length: match[1].length,
  };
}

function isClosingFence(line, fence) {
  const marker = fenceMarker(line);
  return Boolean(marker && marker.char === fence.char && marker.length >= fence.length);
}

function createHeadingIdGenerator() {
  const counts = new Map();

  return (heading) => {
    const base = heading.explicitId || slugText(heading.title);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };
}

export function extractMarkdownToc(markdown, { minDepth = 1, maxDepth = 2 } = {}) {
  const nextId = createHeadingIdGenerator();
  const toc = [];
  let fence = null;

  for (const line of String(markdown).split(/\n/)) {
    const marker = fenceMarker(line);
    if (fence) {
      if (isClosingFence(line, fence)) fence = null;
      continue;
    }
    if (marker) {
      fence = marker;
      continue;
    }

    const heading = headingFromLine(line);
    if (!heading) continue;
    const id = nextId(heading);
    if (heading.depth < minDepth || heading.depth > maxDepth) continue;
    toc.push({
      id,
      title: heading.title,
      depth: heading.depth,
    });
  }

  return toc;
}

export function normalizeHeadingAnchors(markdown) {
  const nextId = createHeadingIdGenerator();
  let fence = null;

  return String(markdown ?? "")
    .split(/\n/)
    .map((line) => {
      const marker = fenceMarker(line);
      if (fence) {
        if (isClosingFence(line, fence)) fence = null;
        return line;
      }
      if (marker) {
        fence = marker;
        return line;
      }

      const heading = headingFromLine(line);
      if (!heading) return line;
      return `<span id="${escapeHtml(nextId(heading))}" class="slex-doc-heading-anchor"></span>\n${heading.hashes} ${heading.renderedTitle}`;
    })
    .join("\n");
}
