---
title: "Grid"
category: Layout
status: ready
summary: "Responsive equal-width grid for sibling cards, metrics, and field groups."
---
# Grid

Responsive equal-width column layout with breakpoint-prefixed column count.

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
        "label": "Requests",
        "value": "1.2k"
      },
      "stat:b": {
        "label": "Success",
        "value": "98%"
      },
      "stat:c": {
        "label": "Errors",
        "value": "3"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for metric dashboards, card lists, and horizontal equal-width groups of form fields.
- Not suitable for mixed-width layouts (use `row` + `column` combinations) or single-column arrangements (use `column`).
- Related components: `row` for horizontal layout without equal-width guarantees, `column` for vertical layout.
- Child components are automatically equal-width — best for same-level content.
- Use `gap` to override the spacing; when omitted, the grid keeps its theme CSS default.

### Column variants

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

## API Reference {#api}

<!-- slex:spec-api:start component="grid" sourceHash="e8ab3ffb" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `columns` | number | No | Yes | `1` | Base column count. |
| `smColumns` | number | No | Yes |  | Column count at the small breakpoint. |
| `mdColumns` | number | No | Yes |  | Column count at the medium breakpoint. |
| `lgColumns` | number | No | Yes |  | Column count at the large breakpoint. |
| `xlColumns` | number | No | Yes |  | Column count at the extra-large breakpoint. |
| `gap` | string | No | Yes |  | Spacing between grid items. |
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
