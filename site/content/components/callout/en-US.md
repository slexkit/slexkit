---
title: "Callout"
category: Content
status: ready
order: 40
summary: "Highlighted contextual message for notes, warnings, and tips."
---
# Callout

Prominent notice block with title, body text, and semantic tone.

<!-- slex:spec-example:start component="callout" id="basic" sourceHash="e07c6bdd" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_callout_typical",
  "layout": {
    "callout:notice": {
      "tone": "info",
      "title": "Notice",
      "icon": "info",
      "text": "Use callout for information that should stand out."
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for operation instructions, caution warnings, success prompts, and informational messages.
- Not suitable for pure status labels (use `badge`) or interactive content that needs its own flow.
- Related components: `badge` for compact labels, `toast` for transient feedback.
- Child components can be nested inside a callout to extend the body area.
- Use `tone` only for semantic state, not as an arbitrary style picker.

### Tone variants

```slex
{
  namespace: "doc_callout_tone_diff",
  layout: {
    "column:tones": {
      "callout:info": {
        tone: "info",
        title: "Info",
        text: "This is an informational message."
      },
      "callout:success": {
        tone: "success",
        title: "Success",
        text: "Operation completed successfully."
      },
      "callout:warning": {
        tone: "warning",
        title: "Warning",
        text: "Please review before proceeding."
      },
      "callout:danger": {
        tone: "danger",
        title: "Danger",
        text: "This action cannot be undone."
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="callout" sourceHash="aed6ad17" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `title` | string | No | Yes |  | Callout title. |
| `heading` | string | No | Yes |  | Alias for title. |
| `label` | string | No | Yes |  | Alias for title. |
| `icon` | string | No | No |  | Icon name shown before the title. |
| `text` | string | No | Yes |  | Callout body text. |
| `message` | string | No | Yes |  | Alias for text. |
| `content` | string | No | Yes |  | Alias for text. |
| `tone` | string: info, success, warning, danger | No | No | `"info"` | Semantic tone for the callout. |
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
