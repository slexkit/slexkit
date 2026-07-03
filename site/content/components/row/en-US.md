---
title: "Row"
category: Layout
status: ready
order: 30
summary: "Horizontal layout container for toolbars, status lines, and button groups."
---
# Row

Basic horizontal layout container.

<!-- slex:spec-example:start component="row" id="basic" sourceHash="6d23c539" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_row_typical",
  "layout": {
    "row:toolbar": {
      "justify": "space-between",
      "text:title": {
        "text": "Runtime status"
      },
      "button:refresh": {
        "label": "Refresh"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for button groups, toolbars, status indicator lines, and table header actions.
- Not suitable for vertical form fields (use `column`) or equal-width card grids (use `grid`).
- Related components: `column` for vertical layout, `grid` for two-dimensional equal-width layout.
- Children arrange at natural width; use `justify` to control distribution.
- Use `gap` to override the spacing between children; when omitted, the row keeps its theme CSS default.

### Justify variants

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

## API Reference {#api}

<!-- slex:spec-api:start component="row" sourceHash="70f941d7" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `justify` | string: start, center, end, space-between, space-around | No | No | `"start"` | Main-axis distribution. |
| `align` | string: start, center, end, baseline, stretch | No | No | `"center"` | Cross-axis alignment. |
| `gap` | string | No | Yes |  | Spacing between children. |
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
