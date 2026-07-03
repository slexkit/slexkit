---
title: "Button"
category: Action
status: ready
order: 10
summary: "Action trigger button."
---
# Button

Triggers actions in interactive SlexKit layouts.

<!-- slex:spec-example:start component="button" id="basic" sourceHash="267bd8d1" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_button_typical",
  "layout": {
    "row:actions": {
      "button:save": {
        "label": "Save",
        "icon": "floppy-disk",
        "variant": "primary"
      },
      "button:cancel": {
        "label": "Cancel",
        "variant": "secondary"
      },
      "button:delete": {
        "label": "Delete",
        "variant": "danger"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for form submission, confirmation actions, and command triggers.
- When `href` is present, the button renders as a button-styled link action; use `link` for ordinary inline navigation.
- `selected`, `active`, and `pressed` describe the visual state of the button icon and pressed metadata.
- Related components: `link` for navigation instead of actions, `submit` for ToolHost submission flows.
- Multiple buttons are typically placed inside a `row`.
- Use `variant` only for semantic action types, not as a general style picker.

### Variants

```slex
{
  namespace: "doc_button_variant_diff",
  layout: {
    "row:variants": {
      "button:primary": {
        label: "Primary",
        variant: "primary"
      },
      "button:secondary": {
        label: "Secondary",
        variant: "secondary"
      },
      "button:danger": {
        label: "Danger",
        variant: "danger"
      },
      "button:ghost": {
        label: "Ghost",
        variant: "ghost"
      }
    }
  }
}
```

### Disabled state

```slex
{
  namespace: "doc_button_disabled_diff",
  layout: {
    "row:disabled": {
      "button:enabled": {
        label: "Enabled"
      },
      "button:disabled": {
        label: "Disabled",
        disabled: true
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="button" sourceHash="11a5a574" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `label` | string | No | Yes |  | Visible button text and accessible name. |
| `icon` | string | No | No |  | Icon name shown before the label. |
| `iconOnly` | boolean | No | No | `false` | Show only the icon while retaining label as the accessible name. |
| `variant` | string: primary, secondary, danger, ghost | No | No | `"primary"` | Semantic action variant. |
| `disabled` | boolean | No | Yes | `false` | Disable the action. |
| `href` | string | No | Yes |  | Render the button surface as a link to this URL. |
| `target` | string | No | No |  | Link target used when href is present. |
| `title` | string | No | Yes |  | Tooltip and accessible-label fallback. |
| `selected` | boolean | No | Yes |  | Render the icon in its selected visual state. |
| `active` | boolean | No | Yes |  | Render the icon in its active visual state. |
| `pressed` | boolean | No | Yes |  | Expose pressed state and render the selected icon style. |
| `onclick` | write-expression | No | No |  | Write expression invoked when the button is clicked. |
<!-- slex:spec-api:end -->
