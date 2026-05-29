---
title: "Badge"
category: Content
status: ready
summary: "Compact label for status or classification."
---
# Badge

Compact status label component with semantic tone colors.

<!-- slex:spec-example:start component="badge" id="basic" sourceHash="0f5f8aba" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_badge_typical",
  "layout": {
    "row:badges": {
      "badge:ready": {
        "label": "ready",
        "icon": "check-circle",
        "tone": "success"
      },
      "badge:pending": {
        "label": "pending",
        "tone": "warning"
      },
      "badge:info": {
        "label": "info",
        "tone": "info"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for status indicators (success / warning / error), classification labels, and count markers.
- Not suitable for long text labels (use `callout`) or interactive triggers (use `button`).
- Related components: `callout` for titled message blocks, `stat` for numeric metrics.
- Multiple badges are typically placed inside a `row`.
- Use `tone` only for semantic state, not as an arbitrary style picker.

### Tone variants

```slex
{
  namespace: "doc_badge_tone_diff",
  layout: {
    "row:tones": {
      "badge:info": {
        label: "info",
        tone: "info"
      },
      "badge:success": {
        label: "success",
        tone: "success"
      },
      "badge:warning": {
        label: "warning",
        tone: "warning"
      },
      "badge:danger": {
        label: "danger",
        tone: "danger"
      },
      "badge:muted": {
        label: "muted",
        tone: "muted"
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="badge" sourceHash="5621b8b3" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `label` | string | No | Yes |  | Badge text. |
| `text` | string | No | Yes |  | Alias for label. |
| `content` | string | No | Yes |  | Alias for label. |
| `icon` | string | No | No |  | Icon name shown before the badge label. |
| `tone` | string: info, success, warning, danger, muted | No | No | `"info"` | Semantic tone applied to the badge. |
| `variant` | string: info, success, warning, danger, muted | No | No |  | Alias for tone. |
<!-- slex:spec-api:end -->
