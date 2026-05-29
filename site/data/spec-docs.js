import {
  componentSpecs,
  getLocalizedComponentSpec,
  hashSpecText,
  localizeComponentSpecs,
} from "../../src/components/spec-registry";
import zhCNOverlay from "../i18n/spec/zh-CN.json" with { type: "json" };
import zhSpecText from "../i18n/spec/zh-CN.text.json" with { type: "json" };
import { defaultLocale, normalizeLocale } from "./locales.js";
import { componentTitleForLocale } from "./doc-metadata.js";
import { siteUiLabelsForLocale } from "./ui-labels.js";

export function escapeMarkdownCell(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
}

function translatedSpecText(source) {
  return zhSpecText[source] ?? source;
}

function createOverlayEntry(source, translation) {
  return {
    source,
    sourceHash: hashSpecText(source),
    translation,
  };
}

function buildZhCNOverlay() {
  const entries = {};
  for (const spec of componentSpecs) {
    entries[`components.${spec.type}.title`] = createOverlayEntry(
      spec.title,
      componentTitleForLocale(spec.type, spec.title, "zh-CN"),
    );
    entries[`components.${spec.type}.summary`] = createOverlayEntry(spec.summary, translatedSpecText(spec.summary));
    entries[`components.${spec.type}.description`] = createOverlayEntry(spec.description, translatedSpecText(spec.description));
    if (spec.children.description) {
      entries[`components.${spec.type}.children.description`] = createOverlayEntry(
        spec.children.description,
        translatedSpecText(spec.children.description),
      );
    }
    for (const [name, prop] of Object.entries(spec.props)) {
      entries[`components.${spec.type}.props.${name}.description`] = createOverlayEntry(
        prop.description,
        translatedSpecText(prop.description),
      );
    }
  }

  return {
    locale: "zh-CN",
    entries: {
      ...entries,
      ...(zhCNOverlay.entries ?? {}),
    },
  };
}

export function overlayForLocale(locale) {
  return normalizeLocale(locale) === "zh-CN" ? buildZhCNOverlay() : undefined;
}

export function localizedComponentSpec(type, locale = defaultLocale) {
  return getLocalizedComponentSpec(type, locale, overlayForLocale(locale));
}

export function markdownFence(source) {
  return ["```slex", JSON.stringify(source, null, 2), "```"].join("\n");
}

export function specApiTable(spec, locale = defaultLocale) {
  const labels = siteUiLabelsForLocale(locale);
  const rows = [
    `| ${labels.apiField} | ${labels.apiType} | ${labels.apiRequired} | ${labels.apiDynamic} | ${labels.apiDefault} | ${labels.apiDescription} |`,
    "|---|---|---|---|---|---|",
  ];

  for (const [name, prop] of Object.entries(spec.props)) {
    const required = prop.required ? labels.yes : labels.no;
    const dynamic = prop.dynamic ? labels.yes : labels.no;
    const type = prop.values?.length ? `${prop.type}: ${prop.values.join(", ")}` : prop.type;
    const defaultValue = "default" in prop ? `\`${JSON.stringify(prop.default)}\`` : "";
    rows.push(`| \`${escapeMarkdownCell(name)}\` | ${escapeMarkdownCell(type)} | ${required} | ${dynamic} | ${escapeMarkdownCell(defaultValue)} | ${escapeMarkdownCell(prop.description)} |`);
  }

  if (spec.children.allowed) {
    rows.push(`| ${labels.childComponents} | object | ${labels.no} | ${labels.no} |  | ${escapeMarkdownCell(spec.children.description ?? labels.childComponentsFallback)} |`);
  }

  return rows.join("\n");
}

export function specExample(spec, id = "basic") {
  const selected = spec.examples.find((entry) => entry.id === id) ?? spec.examples[0];
  if (!selected) return "";
  return [
    selected.description ? `${selected.description}\n` : "",
    markdownFence(selected.source),
  ].filter(Boolean).join("\n");
}

export function specExampleHash(spec, id = "basic") {
  return hashSpecText(specExample(spec, id));
}

export function specApiHash(spec, locale = defaultLocale) {
  return hashSpecText(specApiTable(spec, locale));
}

export function exportComponentSpecManifest(locale = "en-US") {
  const nextLocale = normalizeLocale(locale);
  return {
    locale: nextLocale,
    generatedFrom: "src/components/entries",
    components: localizeComponentSpecs(nextLocale, overlayForLocale(nextLocale)),
  };
}
