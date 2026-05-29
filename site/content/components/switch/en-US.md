---
title: "Switch"
category: Input
status: ready
summary: "Boolean toggle input for instant settings."
---
# Switch

Boolean toggle for instant-activation settings.

<!-- slex:spec-example:start component="switch" id="basic" sourceHash="9c7b3bda" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_switch_typical",
  "layout": {
    "switch:feature": {
      "enabled": true,
      "label": "Enable sync",
      "icon": "arrows-clockwise"
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for feature toggles, preference enable/disable, and instant-effect settings.
- Not suitable for confirmation-style toggles (use `checkbox`).
- Related components: `checkbox` for confirmations or multi-select.
- Typically placed inside a `row` or `column`.
- Use `$enabled` and `onchange` for state binding.

### Enabled / disabled variants

```slex
{
  namespace: "doc_switch_state_diff",
  layout: {
    "row:diff": {
      "switch:enabled": {
        label: "Enabled",
        enabled: true
      },
      "switch:disabled": {
        label: "Disabled"
      },
      "switch:enabled-not-available": {
        label: "Enabled (not available)",
        enabled: true,
        disabled: true
      },
      "switch:disabled-not-available": {
        label: "Disabled (not available)",
        disabled: true
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="switch" sourceHash="27367ad0" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `enabled` | boolean | No | Yes | `false` | Enabled state. |
| `label` | string | No | Yes |  | Switch label. |
| `icon` | string | No | No |  | Icon name shown before the visible label. |
| `disabled` | boolean | No | Yes | `false` | Disable the switch. |
| `haptic` | boolean | No | No | `true` | Enable vibration feedback on supported devices. |
| `haptics` | boolean | No | No | `true` | Alias for haptic. |
| `onchange` | write-expression | No | No |  | Write expression invoked when enabled state changes. |
<!-- slex:spec-api:end -->
