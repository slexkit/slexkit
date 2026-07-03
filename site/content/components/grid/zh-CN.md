---
title: "Grid"
category: Layout
status: ready
order: 40
summary: "响应式等宽网格。适合同级卡片、指标、字段组。"
---
# Grid 网格

响应式等宽列布局，通过 columns 及断点前缀控制不同屏幕宽度下的列数。

<!-- slex:spec-example:start component="grid" id="basic" sourceHash="fc9c72e9" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_grid_typical",
  "layout": {
    "grid:stats": {
      "columns": 1,
      "mdColumns": 3,
      "stat:a": {
        "label": "请求数",
        "value": "1.2k"
      },
      "stat:b": {
        "label": "成功",
        "value": "98%"
      },
      "stat:c": {
        "label": "错误",
        "value": "3"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：指标看板、卡片列表、表单字段的水平等宽分组。
- 不适合：非等宽混合布局（应当用 row + column 组合）、单列垂直排列（应当用 column）。
- 关联组件：row 水平排列但不保证等宽，column 垂直排列。
- 子组件自动等宽，适合同层级内容。
- `gap` 用于覆盖网格项间距；省略时使用主题 CSS 默认间距。

### columns 变体

```slex
{
  namespace: "doc_grid_columns_diff",
  layout: {
    "column:demo": {
      "text:cols2": {
        text: "columns: 2"
      },
      "grid:cols2": {
        columns: 2,
        "stat:a": {
          label: "A",
          value: "1"
        },
        "stat:b": {
          label: "B",
          value: "2"
        },
        "stat:c": {
          label: "C",
          value: "3"
        }
      },
      "text:cols3": {
        text: "columns: 3"
      },
      "grid:cols3": {
        columns: 3,
        "stat:a": {
          label: "A",
          value: "1"
        },
        "stat:b": {
          label: "B",
          value: "2"
        },
        "stat:c": {
          label: "C",
          value: "3"
        }
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="grid" sourceHash="e8ab3ffb" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `columns` | number | 否 | 是 | `1` | 基础列数。 |
| `smColumns` | number | 否 | 是 |  | 小屏断点列数。 |
| `mdColumns` | number | 否 | 是 |  | 中屏断点列数。 |
| `lgColumns` | number | 否 | 是 |  | 大屏断点列数。 |
| `xlColumns` | number | 否 | 是 |  | 超大屏断点列数。 |
| `gap` | string | 否 | 是 |  | 网格项之间的间距。 |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
