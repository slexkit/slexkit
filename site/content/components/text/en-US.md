---
title: "Text"
category: Display
status: ready
order: 20
summary: "Short text output for status, description, and results."
---
# Text

Output text content for status messages, descriptions, and result display.

<!-- slex:spec-example:start component="text" id="basic" sourceHash="bd63ce36" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_text_typical",
  "layout": {
    "text:status": {
      "text": "System is healthy"
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for status text, short descriptions, label values, and lightweight output.
- Not suitable for long paragraphs or structured data (use `table`).
- Related components: `stat` for numeric metrics, `badge` for status labels.
- Keep text short; use multiple `text` nodes for longer content.
- Typically placed inside `row`, `column`, or `card`.

## API Reference {#api}

<!-- slex:spec-api:start component="text" sourceHash="745fea9a" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `text` | string | No | Yes |  | Displayed text. |
| `content` | string | No | Yes |  | Alias for text. |
| `label` | string | No | Yes |  | Alias for text. |
| `variant` | string: default, muted | No | No | `"default"` | Text visual variant. |
| `color` | string | No | Yes |  | Optional CSS color for controlled previews. |
| `size` | string \| number | No | Yes |  | Optional font size. Numbers are treated as px. |
| `class` | string | No | No |  | Additional host-controlled CSS class. |
<!-- slex:spec-api:end -->
