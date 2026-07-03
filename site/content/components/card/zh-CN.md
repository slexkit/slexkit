---
title: "Card"
category: Layout
status: ready
order: 50
summary: "分组容器。用于把一组相关内容放在一个带边框的表面里。"
---
# Card 卡片

带边框的容器，可选标题和语义色调。

<!-- slex:spec-example:start component="card" id="basic" sourceHash="74b8c7a0" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_card_typical",
  "layout": {
    "card:metrics": {
      "title": "指标",
      "icon": "chart-bar",
      "grid:items": {
        "columns": 2,
        "stat:requests": {
          "label": "请求数",
          "value": "1.2k",
          "unit": "/min"
        },
        "stat:latency": {
          "label": "延迟",
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
        title: "信息",
        tone: "info",
        "text:body": {
          text: "信息卡片。"
        }
      },
      "card:success": {
        title: "成功",
        tone: "success",
        "text:body": {
          text: "成功卡片。"
        }
      },
      "card:warning": {
        title: "警告",
        tone: "warning",
        "text:body": {
          text: "警告卡片。"
        }
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="card" sourceHash="add47956" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `title` | string | 否 | 是 |  | 卡片标题。 |
| `icon` | string | 否 | 否 |  | 显示在标题前的图标名称。 |
| `tone` | string: info, success, warning, danger, muted | 否 | 否 |  | 卡片表面的可选语义色调。 |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
