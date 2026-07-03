---
title: "Column"
category: Layout
status: ready
order: 20
summary: "Vertical layout container for forms, text, and control groups."
---
# Column

Basic vertical layout container.

<!-- slex:spec-example:start component="column" id="basic" sourceHash="b28bf5e9" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_column_typical",
  "layout": {
    "column:form": {
      "input:name": {
        "placeholder": "Name"
      },
      "input:email": {
        "placeholder": "Email"
      },
      "button:save": {
        "label": "Save"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for form field groups, settings panels, description text, and sequences of actions.
- Not suitable for horizontal layouts (use `row`) or equal-width card grids (use `grid`).
- Related components: `row` for horizontal layout, `grid` for two-dimensional equal-width layout.
- Place child components as fields, stacked top-to-bottom.
- Default width fills the parent container; height is content-driven.

## API Reference {#api}

<!-- slex:spec-api:start component="column" sourceHash="5a83045d" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
