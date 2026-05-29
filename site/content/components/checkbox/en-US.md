---
title: "Checkbox"
category: Input
status: ready
summary: "Boolean checkbox for confirmations and multi-select."
---
# Checkbox

Boolean toggle for confirmation or multi-select scenarios.

<!-- slex:spec-example:start component="checkbox" id="basic" sourceHash="060e0c05" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_checkbox_typical",
  "layout": {
    "checkbox:agree": {
      "checked": true,
      "label": "I agree",
      "icon": "handshake"
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for terms agreement, multi-select settings, and per-item enable/disable.
- Not suitable for instant-activation toggles (use `switch`) or mutually exclusive options (use `radio-group`).
- Related components: `switch` for instant effect toggles, `radio-group` for exclusive options.
- Multiple options are typically arranged vertically inside a `column`.
- Use `$checked` and `onchange` for state binding.

### Checked / disabled states

```slex
{
  namespace: "doc_checkbox_state_diff",
  layout: {
    "column:diff": {
      "checkbox:checked": {
        label: "Checked",
        checked: true
      },
      "checkbox:unchecked": {
        label: "Unchecked"
      },
      "checkbox:disabled-checked": {
        label: "Disabled checked",
        checked: true,
        disabled: true
      },
      "checkbox:disabled": {
        label: "Disabled",
        disabled: true
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="checkbox" sourceHash="a507c04a" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `checked` | boolean | No | Yes | `false` | Checked state. |
| `label` | string | No | Yes |  | Checkbox label. |
| `icon` | string | No | No |  | Icon name shown before the visible label. |
| `disabled` | boolean | No | Yes | `false` | Disable the checkbox. |
| `haptic` | boolean | No | No | `true` | Enable vibration feedback on supported devices. |
| `haptics` | boolean | No | No | `true` | Alias for haptic. |
| `onchange` | write-expression | No | No |  | Write expression invoked when checked state changes. |
<!-- slex:spec-api:end -->
