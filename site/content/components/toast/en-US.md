---
title: "Toast"
category: Feedback
status: ready
order: 20
summary: "Transient notification with semantic type."
---
# Toast

Inline notification with semantic type and optional icon.

<!-- slex:spec-example:start component="toast" id="basic" sourceHash="1cab367e" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_toast_typical",
  "layout": {
    "toast:saved": {
      "type": "success",
      "title": "Saved",
      "icon": "check-circle",
      "description": "Changes have been written."
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for save confirmations, operation errors, and status change notifications.
- Not suitable for messages that require user response or long-term visibility — use an inline form or `callout` instead.
- Related components: `callout` for in-page prompt blocks, `badge` for compact status.
- Set `duration` for auto-hide behavior; without it, the toast renders as an inline notification card.
- Use `type` only for semantic message purpose.

### Type variants

```slex
{
  namespace: "doc_toast_type_diff",
  layout: {
    "column:types": {
      "toast:info": {
        type: "info",
        title: "Info",
        description: "A new update is available."
      },
      "toast:success": {
        type: "success",
        title: "Success",
        description: "Operation completed."
      },
      "toast:warning": {
        type: "warning",
        title: "Warning",
        description: "Review before proceeding."
      },
      "toast:danger": {
        type: "danger",
        title: "Error",
        description: "Something went wrong."
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="toast" sourceHash="854ea3a2" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `title` | string | No | Yes |  | Toast title. |
| `heading` | string | No | Yes |  | Alias for title. |
| `label` | string | No | Yes |  | Alias for title. |
| `icon` | string | No | No |  | Icon name shown at the left of the toast. |
| `description` | string | No | Yes |  | Toast body text. |
| `text` | string | No | Yes |  | Alias for description. |
| `message` | string | No | Yes |  | Alias for description. |
| `content` | string | No | Yes |  | Alias for description. |
| `type` | string: info, success, warning, danger | No | No | `"info"` | Semantic notification type. |
| `tone` | string: info, success, warning, danger | No | No | `"info"` | Alias for type. |
| `duration` | number | No | No |  | Auto-hide delay in milliseconds. |
| `dismissable` | boolean | No | No | `true` | Show a close button. |
| `dismissible` | boolean | No | No | `true` | Alias for dismissable. |
| `closeLabel` | string | No | No | `"Close notification"` | Accessible close button label. |
| `closeAriaLabel` | string | No | No |  | Alias for closeLabel. |
<!-- slex:spec-api:end -->
