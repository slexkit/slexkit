import { describeSlexElements } from "../../src/web-components/definitions";
import { defaultLocale, normalizeLocale } from "./locales.js";
import { siteUiLabelsForLocale } from "./ui-labels.js";

export function escapeMarkdownCell(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function descriptor(type) {
  return describeSlexElements().find((item) => item.tagName === `slex-${type}`);
}

export function overlayForLocale() { return undefined; }

export function localizedComponentSpec(type, locale = defaultLocale) {
  const item = descriptor(type);
  if (!item) return undefined;
  const zh = normalizeLocale(locale) === "zh-CN";
  return {
    type,
    title: item.tagName,
    summary: zh ? "HTML 自定义元素。" : "HTML custom element.",
    description: zh ? "使用标准属性、property、事件与 slot。" : "Uses standard attributes, properties, events, and slots.",
    props: Object.fromEntries(item.properties.map((prop) => [prop.name, {
      type: prop.type,
      required: false,
      dynamic: prop.attribute === undefined,
      description: prop.attribute ? `Attribute: ${prop.attribute}` : "JavaScript property only.",
    }])),
    children: { allowed: item.slots.length > 0, description: item.slots.length ? `Slots: ${item.slots.join(", ")}` : "" },
    examples: [{ id: "basic", title: "HTML", description: "Standard HTML source.", source: `<${item.tagName}></${item.tagName}>` }],
  };
}

export function markdownFence(source) {
  return ["```slex", String(source), "```"].join("\n");
}

export function specApiTable(spec, locale = defaultLocale) {
  const labels = siteUiLabelsForLocale(locale);
  const rows = [
    `| ${labels.apiField} | ${labels.apiType} | ${labels.apiDescription} |`,
    "|---|---|---|",
  ];
  for (const [name, prop] of Object.entries(spec.props)) rows.push(`| \`${escapeMarkdownCell(name)}\` | ${escapeMarkdownCell(prop.type)} | ${escapeMarkdownCell(prop.description)} |`);
  return rows.join("\n");
}

export function specExample(spec, id = "basic") {
  const selected = spec.examples.find((entry) => entry.id === id) ?? spec.examples[0];
  return selected ? `${selected.description || ""}\n\n${markdownFence(selected.source)}`.trim() : "";
}

function hash(source) {
  let value = 2166136261;
  for (let index = 0; index < source.length; index += 1) { value ^= source.charCodeAt(index); value = Math.imul(value, 16777619); }
  return (value >>> 0).toString(16).padStart(8, "0");
}
export const specExampleHash = (spec, id = "basic") => hash(specExample(spec, id));
export const specApiHash = (spec, locale = defaultLocale) => hash(specApiTable(spec, locale));

export function exportComponentSpecManifest(locale = "en-US") {
  return {
    locale: normalizeLocale(locale),
    generatedFrom: "src/web-components/definitions.ts",
    components: describeSlexElements().map((item) => localizedComponentSpec(item.tagName.slice(5), locale)),
  };
}
