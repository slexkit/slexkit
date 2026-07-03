---
title: "Card"
category: Layout
status: ready
order: 50
summary: "Grouping container for related content."
---
# Card

Card-style container with optional title and semantic tone.

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

## Usage Notes

- Use for grouped metrics, settings blocks, and information summaries.
- Not suitable for page-level section headers (use `section`) or pure layout containers (use `column` or `grid`).
- Related components: `section` provides a complete page block structure (title + subtitle + action), while `card` is more lightweight.
- Child components arrange naturally inside a card; nest `row`, `column`, or `grid`.
- Use `tone` only for semantic state, not as an arbitrary style picker.

### Tone variants

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

## API Reference {#api}

<!-- slex:spec-api:start component="card" sourceHash="fd8bc1c8" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `title` | string | No | Yes |  | Card title. |
| `icon` | string | No | No |  | Icon name shown before the title. |
| `tone` | string: info, success, warning, danger, muted | No | No |  | Optional semantic tone for the card surface. |
| `variant` | string: tool | No | No |  | Use tool for ToolHost input cards with compact chrome. |
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
