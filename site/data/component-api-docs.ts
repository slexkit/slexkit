import { componentApiMetadata } from "./component-api";
import { normalizeLocale } from "./locales";
import type { describeSlexElements } from "../../src/web-components/definitions";

type ElementDescriptor = ReturnType<typeof describeSlexElements>[number];

/** Optional authoring UI has a separate registration entry, not a default tag. */
export const playgroundApiDescriptor: ElementDescriptor = {
  tagName: "slex-playground",
  properties: [
    { name: "source", attribute: "source", type: "string" },
    { name: "autorun", attribute: "autorun", type: "boolean" },
  ],
  events: [],
  slots: [],
};

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

export function componentApiReference(element: ElementDescriptor, locale: string): string {
  const slug = element.tagName.slice(5);
  const zh = normalizeLocale(locale) === "zh-CN";
  const metadata = componentApiMetadata[slug];
  if (!metadata) throw new Error(`${element.tagName} has no API documentation metadata`);
  const lines = [
    `## ${zh ? "API 参考" : "API Reference"}`,
    "",
    zh
      ? "默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。"
      : "Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.",
    "",
    zh
      ? "| Property / 属性 | 类型 | 默认值 | 说明 |"
      : "| Property / attribute | Type | Default | Description |",
    "| --- | --- | --- | --- |",
  ];

  const properties = [...element.properties];
  if (slug === "slider") properties.push({ name: "valueAsNumber", attribute: undefined, type: "number" });
  for (const property of properties) {
    const field = metadata[property.name];
    if (!field?.en || !field.zh || field.default === undefined) {
      throw new Error(`${element.tagName}.${property.name} has incomplete API documentation`);
    }
    const name = property.attribute && property.attribute !== property.name
      ? `\`${property.name}\` / \`${property.attribute}\``
      : `\`${property.name}\``;
    const type = field.type || property.type.replaceAll(" | ", " / ");
    const defaultValue = field.default === "unset"
      ? zh ? "未设置" : "unset"
      : field.default === "empty"
        ? zh ? "空" : "empty"
        : `\`${cell(field.default)}\``;
    lines.push(`| ${name} | ${cell(type)} | ${defaultValue} | ${cell(zh ? field.zh : field.en)} |`);
  }

  if (!properties.length) {
    lines.push(zh
      ? "| `default` (slot) | Node[] | 空 | 放入普通 HTML 或其他自定义元素，按列纵向排列；没有组件专属属性。 |"
      : "| `default` (slot) | Node[] | empty | Place ordinary HTML or custom elements in the default slot for vertical layout; there are no component-specific properties. |");
  }
  if (element.events.length) lines.push("", zh
    ? `事件：${element.events.map(name => `\`${name}\``).join("、")}。使用原生事件监听器；交互值从组件 property 读取。`
    : `Events: ${element.events.map(name => `\`${name}\``).join(", ")}. Use native event listeners; read interactive values from component properties.`);
  if (element.slots.length && properties.length) lines.push("", zh
    ? `插槽：${element.slots.map(name => name ? "具名面板（与条目名称对应）" : "默认插槽，接收普通 HTML 或自定义元素").join("；")}。`
    : `Slots: ${element.slots.map(name => name ? "named panels matched to item names" : "default slot accepting ordinary HTML or custom elements").join("; ")}.`);
  return lines.join("\n");
}

/** Preserve examples and the hand-reviewed Input reference from the first pass. */
export function replaceComponentApiReference(markdown: string, element: ElementDescriptor, locale: string): string {
  if (element.tagName === "slex-input") return markdown;
  const heading = normalizeLocale(locale) === "zh-CN" ? "API 参考" : "API Reference";
  const pattern = new RegExp(`^## ${heading}[ \\t]*$[\\s\\S]*?(?=^## |$(?![\\s\\S]))`, "m");
  const reference = componentApiReference(element, locale);
  if (pattern.test(markdown)) return markdown.replace(pattern, reference + "\n\n");
  const summaryHeading = normalizeLocale(locale) === "zh-CN" ? "接口摘要" : "Contract summary";
  const summary = new RegExp(`^## ${summaryHeading}[ \\t]*$`, "m");
  if (summary.test(markdown)) return markdown.replace(summary, reference + "\n\n$&");
  return markdown.trimEnd() + "\n\n" + reference + "\n";
}
