---
title: "Accordion"
category: Disclosure
status: ready
order: 10
summary: "多项折叠面板，适合 FAQ 或分组详情。"
---
# Accordion 折叠面板

管理多个折叠项，同一时间可展开一项或多项。

<!-- slex:spec-example:start component="accordion" id="basic" sourceHash="0a070e32" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_accordion_typical",
  "layout": {
    "accordion:faq": {
      "multiple": true,
      "value": [
        "install"
      ],
      "items": [
        {
          "value": "install",
          "label": "安装",
          "icon": "download-simple",
          "content": "准备依赖。"
        },
        {
          "value": "review",
          "label": "复核",
          "icon": "check-circle",
          "content": "检查结果。"
        },
        {
          "value": "ship",
          "label": "发布",
          "icon": "rocket-launch",
          "content": "发布变更。"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：FAQ、分组详情、可折叠的设置项列表。
- 不适合：单个可展开区域（应当用 collapsible）。
- 关联组件：collapsible 用于单个展开区域。
- 使用 $value 和 onchange 实现受控展开。

## API 参考 {#api}

<!-- slex:spec-api:start component="accordion" sourceHash="e838d3e9" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `value` | string \| string[] | 否 | 是 |  | 当前展开项的值；multiple 为 true 时使用数组。 |
| `multiple` | boolean | 否 | 否 | `false` | 允许同时展开多个项目。 |
| `items` | array | 否 | 否 |  | 面板定义，包含 value、label、content 和可选 icon。 |
| `items[].icon` | string | 否 | 否 |  | 显示在项目触发标签前的图标名称。 |
| `onchange` | write-expression | 否 | 否 |  | 展开项变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
