---
title: "Section"
category: Layout
status: ready
order: 60
summary: "页面区块，带标题、动作和内容区域。"
---
# Section 区块

页面级区块容器，提供标题、副标题、可选操作链接和内容区域。

<!-- slex:spec-example:start component="section" id="basic" sourceHash="094666a8" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_section_typical",
  "layout": {
    "section:overview": {
      "eyebrow": "Dashboard",
      "title": "Runtime overview",
      "icon": "chart-bar",
      "subtitle": "This section groups the most important state.",
      "stat:latency": {
        "label": "Latency",
        "value": "42",
        "unit": "ms"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：仪表盘区块、设置分组、分类内容区域。
- 不适合：纯视觉卡片（应当用 card）、无标题容器（应当用 column）。
- 关联组件：card 是分组容器但更轻量，section 提供更完整的标题结构。
- 标题区与内容区分明，内容区可嵌套任意布局组件。

### eyebrow / subtitle 变体

```slex
{
  namespace: "doc_section_eyebrow_diff",
  layout: {
    "column:demo": {
      "section:with-eyebrow": {
        eyebrow: "Overview",
        title: "With eyebrow",
        "text:body": {
          text: "Eyebrow appears above the title."
        }
      },
      "section:with-subtitle": {
        title: "With subtitle",
        subtitle: "Additional context below the title.",
        "text:body": {
          text: "Subtitle provides extra context."
        }
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="section" sourceHash="03916011" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `title` | string | 否 | 是 |  | 区块标题。 |
| `icon` | string | 否 | 否 |  | 显示在标题前的图标名称。 |
| `eyebrow` | string | 否 | 是 |  | 标题上方的小标签。 |
| `subtitle` | string | 否 | 是 |  | 标题下方的副标题文本。 |
| `actionLabel` | string | 否 | 是 |  | 可选操作链接标签。 |
| `actionHref` | string | 否 | 否 |  | 可选操作链接目标。 |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
