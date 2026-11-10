import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describeSlexElements } from "../../src/web-components/definitions";
import { normalizeLocale, sourceLocale, supportedLocales } from "../data/locales";
import { playgroundApiDescriptor, replaceComponentApiReference } from "../data/component-api-docs";

const siteRoot = fileURLToPath(new URL("..", import.meta.url));
const componentRoot = join(siteRoot, "content", "components");
const checkOnly = process.argv.includes("--check");

type ElementDescriptor = ReturnType<typeof describeSlexElements>[number];

function codeList(values: string[], empty: string): string {
  return values.length > 0 ? values.map((value) => `\`${value || "default"}\``).join(", ") : empty;
}

function contractSummary(element: ElementDescriptor, locale: string): string {
  const zh = normalizeLocale(locale) === "zh-CN";
  const empty = zh ? "无" : "none";
  const attributes = element.properties.flatMap((property) =>
    property.attribute ? [property.attribute] : [],
  );
  const properties = element.properties.map((property) => property.name);
  const lines = [
    `## ${zh ? "接口摘要" : "Contract summary"}`,
    "",
    `- ${zh ? "属性" : "Attributes"}: ${codeList(attributes, empty)}`,
    `- Properties: ${codeList(properties, empty)}`,
    `- Events: ${codeList(element.events, empty)}`,
    `- Slots: ${codeList(element.slots, empty)}`,
    "",
    zh
      ? "准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。"
      : "Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.",
  ];
  return lines.join("\n");
}

function replaceContractSummary(markdown: string, element: ElementDescriptor, locale: string): string {
  const heading = normalizeLocale(locale) === "zh-CN" ? "接口摘要" : "Contract summary";
  const pattern = new RegExp(`^## ${heading}\\s*$[\\s\\S]*?(?=^## |$(?![\\s\\S]))`, "m");
  if (!pattern.test(markdown)) {
    if (element.tagName === "slex-playground") return markdown.trimEnd() + "\n\n" + contractSummary(element, locale) + "\n";
    throw new Error(`${element.tagName} is missing its ${heading} section`);
  }
  return markdown.replace(pattern, (current) => {
    const trailingWhitespace = current.match(/\s*$/)?.[0] ?? "";
    return contractSummary(element, locale) + trailingWhitespace;
  });
}

async function syncComponentFile(element: ElementDescriptor, locale: string) {
  const component = element.tagName.slice(5);
  const file = join(componentRoot, component, `${locale}.md`);
  const markdown = await readFile(file, "utf-8");
  const next = replaceContractSummary(replaceComponentApiReference(markdown, element, locale), element, locale);

  if (next === markdown) return;
  if (checkOnly) {
    const mismatch = Array.from({ length: Math.max(markdown.length, next.length) }).findIndex(
      (_, index) => markdown[index] !== next[index],
    );
    throw new Error(
      `${component}/${locale} API reference or contract summary is stale at offset ${mismatch}: ` +
        `${JSON.stringify(markdown.slice(mismatch, mismatch + 80))} != ${JSON.stringify(next.slice(mismatch, mismatch + 80))}`,
    );
  }
  await writeFile(file, next, "utf-8");
}

async function main() {
  const elements = new Map(
    [...describeSlexElements(), playgroundApiDescriptor].map((element) => [element.tagName.slice(5), element]),
  );
  const entries = await readdir(componentRoot, { withFileTypes: true });
  for (const entry of entries) {
    const element = elements.get(entry.name);
    if (!entry.isDirectory() || !element) continue;
    for (const locale of supportedLocales) {
      try {
        await syncComponentFile(element, normalizeLocale(locale));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT" && locale !== sourceLocale) continue;
        throw error;
      }
    }
  }
}

await main();
