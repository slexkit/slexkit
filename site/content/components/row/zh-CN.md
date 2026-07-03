---
title: "Row"
category: Layout
status: ready
order: 30
summary: "横向排列子组件。适合工具栏、状态行、按钮组。"
---
# Row 行

基本水平布局容器。

<!-- slex:spec-example:start component="row" id="basic" sourceHash="6d23c539" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_row_typical",
  "layout": {
    "row:toolbar": {
      "justify": "space-between",
      "text:title": {
        "text": "运行时状态"
      },
      "button:refresh": {
        "label": "刷新"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：按钮组、工具栏、状态指示行、表头操作区。
- 不适合：垂直表单字段（应当用 column）、等宽卡片网格（应当用 grid）。
- 关联组件：column 垂直排列，grid 二维等宽网格。
- 子组件自然宽度排列，可通过 justify 控制分布。
- `gap` 用于覆盖子组件间距；省略时使用主题 CSS 默认间距。

### justify 变体

```slex
{
  namespace: "doc_row_justify_diff",
  layout: {
    "column:demo": {
      "text:start": {
        text: "justify: start"
      },
      "row:justify-start": {
        justify: "start",
        "badge:a": {
          label: "A"
        },
        "badge:b": {
          label: "B"
        }
      },
      "text:center": {
        text: "justify: center"
      },
      "row:justify-center": {
        justify: "center",
        "badge:a": {
          label: "A"
        },
        "badge:b": {
          label: "B"
        }
      },
      "text:end": {
        text: "justify: end"
      },
      "row:justify-end": {
        justify: "end",
        "badge:a": {
          label: "A"
        },
        "badge:b": {
          label: "B"
        }
      },
      "text:space-between": {
        text: "justify: space-between"
      },
      "row:justify-between": {
        justify: "space-between",
        "badge:a": {
          label: "A"
        },
        "badge:b": {
          label: "B"
        }
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="row" sourceHash="a483a589" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `justify` | string: start, center, end, space-between, space-around | 否 | 否 | `"start"` | 主轴分布方式。 |
| `align` | string: start, center, end, baseline, stretch | 否 | 否 | `"center"` | 交叉轴对齐方式。 |
| `gap` | string | 否 | 是 |  | 子组件之间的间距。 |
| `variant` | string: actions | 否 | 否 |  | Use actions for compact ToolHost action rows. |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
