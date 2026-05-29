import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { componentSpecs } from "../../src/components/entries/specs";
import { hashSpecText } from "../../src/components/spec-registry";
import { normalizeLocale, sourceLocale, supportedLocales } from "../data/locales";
import { localizedComponentSpec, specApiTable, specExample } from "../data/spec-docs";

const siteRoot = fileURLToPath(new URL("..", import.meta.url));
const componentRoot = join(siteRoot, "content", "components");

function attrsToString(attrs: Record<string, string>) {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${String(value).replace(/"/g, "&quot;")}"`)
    .join(" ");
}

function replaceBlock(
  markdown: string,
  kind: "spec-api" | "spec-example",
  component: string,
  attrs: Record<string, string>,
  content: string,
) {
  const pattern = new RegExp(
    `<!--\\s*slex:${kind}:start\\s+([^>]*)-->[\\s\\S]*?<!--\\s*slex:${kind}:end\\s*-->`,
    "g",
  );
  let replaced = false;
  const next = markdown.replace(pattern, (raw, attrSource) => {
    if (!new RegExp(`component="${component}"`).test(attrSource)) return raw;
    replaced = true;
    return `<!-- slex:${kind}:start ${attrsToString(attrs)} -->\n${content.trim()}\n<!-- slex:${kind}:end -->`;
  });
  if (!replaced) throw new Error(`${component} is missing ${kind} block`);
  return next;
}

async function syncComponentFile(component: string, locale: string) {
  const file = join(componentRoot, component, `${locale}.md`);
  const markdown = await readFile(file, "utf-8");
  const localized = localizedComponentSpec(component, locale);
  const canonical = localizedComponentSpec(component, sourceLocale);
  if (!localized || !canonical) throw new Error(`Missing spec for ${component}`);

  const exampleId = localized.examples[0]?.id ?? "basic";
  const canonicalExample = specExample(canonical, exampleId);
  const canonicalApi = specApiTable(canonical, sourceLocale);
  const example = specExample(localized, exampleId);
  const api = specApiTable(localized, locale);

  let next = replaceBlock(markdown, "spec-example", component, {
    component,
    id: exampleId,
    sourceHash: hashSpecText(canonicalExample),
  }, example);
  next = replaceBlock(next, "spec-api", component, {
    component,
    sourceHash: hashSpecText(canonicalApi),
  }, api);

  if (next !== markdown) await writeFile(file, next, "utf-8");
}

async function main() {
  const components = new Set(componentSpecs.map((spec) => spec.type));
  const entries = await readdir(componentRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !components.has(entry.name)) continue;
    for (const locale of supportedLocales) {
      try {
        await syncComponentFile(entry.name, normalizeLocale(locale));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT" && locale !== sourceLocale) continue;
        throw error;
      }
    }
  }
}

await main();
