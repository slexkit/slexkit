---
title: "Divider"
category: Content
status: ready
order: 35
summary: "分割线，可带 label。"
---
# Divider 分割线

水平分割线，可选在中间显示文本标签。

<!-- slex:spec-example:start component="divider" id="basic" sourceHash="888b7416" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_divider_typical",
  "layout": {
    "column:content": {
      "text:top": {
        "text": "Above"
      },
      "divider:line": {
        "label": "Divider",
        "icon": "flag"
      },
      "text:bottom": {
        "text": "Below"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：表单分区、设置分组、内容段落之间的视觉分隔。
- 不适合：作为布局间距手段（应当用布局容器的 gap）。
- 关联组件：section 是更结构化的区块分隔方案。
- 放在 column 中分隔上下内容区。

## API 参考 {#api}

<!-- slex:spec-api:start component="divider" sourceHash="92dc5387" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `label` | string | 否 | 是 |  | 分割线中显示的文本。 |
| `icon` | string | 否 | 否 |  | 显示在标签前的图标名称。 |
<!-- slex:spec-api:end -->
