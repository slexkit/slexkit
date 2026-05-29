import { componentSpecs, publicComponentTypes } from "../../src/components/spec-registry";
import { normalizeLocale, sourceLocale } from "./locales.js";

export const componentCategoryOrder = [
  "Layout",
  "Content",
  "Display",
  "Action",
  "Input",
  "Navigation",
  "Disclosure",
  "Feedback",
  "Data",
  "Tooling",
  "Component",
];

export const componentCategoryLabels = {
  Tooling: "工具",
  Layout: "布局",
  Display: "展示",
  Content: "内容",
  Action: "操作",
  Input: "输入",
  Navigation: "导航",
  Disclosure: "展开收起",
  Feedback: "反馈",
  Data: "数据",
  Component: "组件",
};

export const componentStatusLabels = {
  ready: "已实现",
  draft: "草稿",
  experimental: "实验中",
  deprecated: "已废弃",
};

export const componentTitleLabels = {
  accordion: "Accordion 折叠面板",
  badge: "Badge 标签",
  button: "Button 按钮",
  callout: "Callout 提示块",
  card: "Card 卡片",
  checkbox: "Checkbox 复选框",
  "code-block": "Code Block 代码块",
  collapsible: "Collapsible 折叠区",
  column: "Column 列",
  divider: "Divider 分割线",
  grid: "Grid 网格",
  icon: "Icon 图标",
  input: "Input 输入框",
  link: "Link 链接",
  playground: "Playground 操场",
  progress: "Progress 进度",
  "radio-group": "Radio Group 单选组",
  row: "Row 行",
  section: "Section 区块",
  select: "Select 下拉选择",
  slider: "Slider 滑块",
  stat: "Stat 指标",
  submit: "Submit 提交按钮",
  switch: "Switch 开关",
  table: "Table 表格",
  tabs: "Tabs 选项卡",
  text: "Text 文本",
  toast: "Toast 通知",
};

export const englishComponentTitleLabels = Object.fromEntries(componentSpecs.map((spec) => [spec.type, spec.title]));
export const publicComponentSlugs = new Set(publicComponentTypes);

export function componentTitleForLocale(type, title, locale, contentLocale = locale) {
  if (normalizeLocale(contentLocale) === sourceLocale) return englishComponentTitleLabels[type] ?? title;
  return normalizeLocale(locale) === "zh-CN" ? componentTitleLabels[type] ?? title : englishComponentTitleLabels[type] ?? title;
}

export function componentCategoryRank(category) {
  const index = componentCategoryOrder.indexOf(category);
  return index === -1 ? componentCategoryOrder.length : index;
}
