---
title: "Collapsible"
category: Disclosure
status: ready
summary: "Single expandable content area."
---
# Collapsible

Manages a single expand/collapse region for supplementary details or secondary information.

<!-- slex:spec-example:start component="collapsible" id="basic" sourceHash="d074a138" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_collapsible_typical",
  "layout": {
    "collapsible:more": {
      "open": true,
      "trigger": "Details",
      "icon": "caret-circle-down",
      "content": "This secondary content can be collapsed."
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for expandable details, supplementary notes, and collapsible secondary info.
- Not suitable for multi-panel lists (use `accordion`).
- Related components: `accordion` for multi-panel collapse.
- Child components extend the default body content area.
- Use `$value` and `onchange` for controlled expansion.

## API Reference {#api}

<!-- slex:spec-api:start component="collapsible" sourceHash="7580b7c4" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `open` | boolean | No | Yes | `false` | Expanded state. |
| `trigger` | string | No | Yes |  | Trigger button text. |
| `icon` | string | No | No |  | Icon name shown before trigger text. |
| `content` | string | No | Yes |  | Static body content. |
| `onchange` | write-expression | No | No |  | Write expression invoked when open state changes. |
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
