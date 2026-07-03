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

const zhExampleVisibleText = {
  "Above": "上方",
  "Auto": "自动",
  "Below": "下方",
  "Build progress": "构建进度",
  "Cancel": "取消",
  "Changes have been written.": "更改已写入。",
  "Check the result.": "检查结果。",
  "Config": "配置",
  "Dashboard": "仪表盘",
  "Delete": "删除",
  "Development": "开发环境",
  "Divider": "分隔线",
  "Email": "邮箱",
  "Enable sync": "启用同步",
  "Enter name": "输入名称",
  "Environment": "环境",
  "Errors": "错误",
  "I agree": "我同意",
  "Ignore": "忽略",
  "Install": "安装",
  "Latency": "延迟",
  "Manual": "手动",
  "Metrics": "指标",
  "Mode": "模式",
  "Name": "姓名",
  "Notice": "提示",
  "Overview": "概览",
  "Prepare dependencies.": "准备依赖。",
  "Production": "生产环境",
  "Project": "项目",
  "Publish the change.": "发布变更。",
  "Refresh": "刷新",
  "Requests": "请求数",
  "Review": "复核",
  "Runtime overview": "运行时概览",
  "Runtime status": "运行时状态",
  "Save": "保存",
  "Saved": "已保存",
  "Settings": "设置",
  "Ship": "发布",
  "Stat Playground": "Stat 试验台",
  "Status": "状态",
  "Submit": "提交",
  "Success": "成功",
  "System is healthy": "系统正常",
  "This secondary content can be collapsed.": "这段补充内容可以折叠。",
  "This section groups the most important state.": "本节汇总最重要的状态。",
  "Title": "标题",
  "Use callout for information that should stand out.": "用提示块突出需要注意的信息。",
  "View components": "查看组件",
  "Visible labels keep form fields scannable.": "可见标签让表单字段更易扫读。",
  "Volume": "音量",
  "info": "信息",
  "pending": "待处理",
  "ready": "就绪",
};

const exampleVisiblePropNames = new Set([
  "actionLabel",
  "cancelLabel",
  "closeLabel",
  "confirmLabel",
  "content",
  "description",
  "eyebrow",
  "heading",
  "ignoreLabel",
  "label",
  "placeholder",
  "submitLabel",
  "subtitle",
  "text",
  "title",
]);

function localizeExampleSource(value, locale, propName = "") {
  if (Array.isArray(value)) return value.map((item) => localizeExampleSource(item, locale, propName));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, localizeExampleSource(child, locale, key)]),
    );
  }
  if (normalizeLocale(locale) === "zh-CN" && typeof value === "string" && exampleVisiblePropNames.has(propName)) {
    return zhExampleVisibleText[value] ?? value;
  }
  return value;
}

function localizeSpecExamples(spec, locale) {
  if (normalizeLocale(locale) !== "zh-CN") return spec;
  return {
    ...spec,
    examples: spec.examples.map((entry) => ({
      ...entry,
      source: localizeExampleSource(entry.source, locale),
    })),
  };
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
  const spec = getLocalizedComponentSpec(type, locale, overlayForLocale(locale));
  return spec ? localizeSpecExamples(spec, locale) : spec;
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
