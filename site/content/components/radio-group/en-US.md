---
title: "Radio Group"
category: Input
status: ready
order: 70
summary: "Mutually exclusive radio selection."
---
# Radio Group

Mutually exclusive option selection for small choice sets.

<!-- slex:spec-example:start component="radio-group" id="basic" sourceHash="4ad4aa38" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_radio_group_typical",
  "layout": {
    "radio-group:mode": {
      "label": "Mode",
      "icon": "sliders-horizontal",
      "value": "auto",
      "options": [
        {
          "label": "Auto",
          "value": "auto",
          "icon": "sparkle"
        },
        {
          "label": "Manual",
          "value": "manual",
          "icon": "wrench"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for mode selection, small enum choices, and mutually exclusive config items.
- Not suitable for many options (use `select`).
- Related components: `select` for dropdown single selection with more options.
- Keep options between 2-5 items.
- Use `$value` and `onchange` for state binding.

## API Reference {#api}

<!-- slex:spec-api:start component="radio-group" sourceHash="9770be28" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `value` | string | No | Yes |  | Current selected value. |
| `label` | string | No | Yes |  | Group label. |
| `icon` | string | No | No |  | Icon name shown before the group label. |
| `options` | array | No | No |  | Options with label, value, and optional icon. |
| `options[].icon` | string | No | No |  | Icon name shown before a single option label. |
| `disabled` | boolean | No | Yes | `false` | Disable every radio option in the group. |
| `orientation` | string: vertical, horizontal | No | No | `"vertical"` | Radio option layout direction. |
| `haptic` | boolean | No | No | `true` | Enable vibration feedback on supported devices. |
| `haptics` | boolean | No | No | `true` | Alias for haptic. |
| `name` | string | No | No |  | Native radio group name shared by options. |
| `onchange` | write-expression | No | No |  | Write expression invoked when selection changes. |
<!-- slex:spec-api:end -->
