---
title: "Card"
category: Layout
status: ready
order: 50
summary: "分组容器。用于把一组相关内容放在卡片表面里。"
---
# Card 卡片

卡片式容器，可选标题和语义色调。

<!-- slex:spec-example:start component="card" id="basic" sourceHash="74b8c7a0" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_card_typical",
  "layout": {
    "card:metrics": {
      "title": "Metrics",
      "icon": "chart-bar",
      "grid:items": {
        "columns": 2,
        "stat:requests": {
          "label": "Requests",
          "value": "1.2k",
          "unit": "/min"
        },
        "stat:latency": {
          "label": "Latency",
          "value": "42",
          "unit": "ms"
        }
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：分组指标、设置区块、信息摘要。
- 不适合：页面级区块标题（应当用 section）、纯布局容器（应当用 column 或 grid）。
- 关联组件：section 提供更完整的页面区块结构（含标题+副标题+操作），card 更轻量。
- 子组件在卡片内自然排列（可嵌套 row、column、grid）。
- tone 只表达语义状态，不作为任意样式选择器。

### tone 变体

```slex
{
  namespace: "doc_card_tone_diff",
  layout: {
    "row:tones": {
      "card:info": {
        title: "Info",
        tone: "info",
        "text:body": {
          text: "Information card."
        }
      },
      "card:success": {
        title: "Success",
        tone: "success",
        "text:body": {
          text: "Success card."
        }
      },
      "card:warning": {
        title: "Warning",
        tone: "warning",
        "text:body": {
          text: "Warning card."
        }
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="card" sourceHash="fd8bc1c8" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `title` | string | 否 | 是 |  | 卡片标题。 |
| `icon` | string | 否 | 否 |  | 显示在标题前的图标名称。 |
| `tone` | string: info, success, warning, danger, muted | 否 | 否 |  | 卡片表面的可选语义色调。 |
| `variant` | string: tool | 否 | 否 |  | Use tool for ToolHost input cards with compact chrome. |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
