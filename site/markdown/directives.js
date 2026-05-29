export const specBlockPattern =
  /<!--\s*slex:(spec-api|spec-example):start\s+([^>]*)-->\s*([\s\S]*?)\s*<!--\s*slex:\1:end\s*-->/g;

export function parseDirectiveAttributes(source = "") {
  const attrs = {};
  for (const match of String(source).matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g)) {
    attrs[match[1]] = match[2].replace(/&quot;/g, "\"");
  }
  return attrs;
}

export function findSpecBlocks(markdown) {
  return [...String(markdown).matchAll(specBlockPattern)].map((match) => ({
    kind: match[1],
    attrs: parseDirectiveAttributes(match[2]),
    content: match[3].trim(),
    raw: match[0],
  }));
}

export function assertComponentSpecBlocks(markdown, component) {
  const blocks = findSpecBlocks(markdown);
  const apiBlocks = blocks.filter((block) => block.kind === "spec-api");
  const exampleBlocks = blocks.filter((block) => block.kind === "spec-example");
  if (apiBlocks.length !== 1) throw new Error(`${component} must contain exactly one spec-api block`);
  if (exampleBlocks.length < 1) throw new Error(`${component} must contain at least one spec-example block`);

  for (const block of blocks) {
    if (block.attrs.component !== component) {
      throw new Error(`${component} ${block.kind} block points to component="${block.attrs.component}"`);
    }
  }
  return blocks;
}
