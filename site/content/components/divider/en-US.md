---
title: "Divider"
category: Content
status: ready
summary: "Separator line, optionally with label."
---
# Divider

Horizontal separator, optionally with a centered text label.

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

## Usage Notes

- Use for form sections, settings groups, and visual separation between content paragraphs.
- Not suitable as a spacing mechanism (use layout container `gap`).
- Related components: `section` for more structured block separation.
- Place inside a `column` to separate upper and lower content areas.

## API Reference {#api}

<!-- slex:spec-api:start component="divider" sourceHash="92dc5387" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `label` | string | No | Yes |  | Text shown in the divider. |
| `icon` | string | No | No |  | Icon name shown before the label. |
<!-- slex:spec-api:end -->
