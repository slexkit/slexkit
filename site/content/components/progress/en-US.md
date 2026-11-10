---
title: "Progress"
category: Feedback
status: ready
order: 10
summary: "Progress bar."
---

# Progress

Displays determinate progress from `value` or an indeterminate state, with optional label and accessible name.

## HTML example

```slex
<slex-progress></slex-progress>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `""` | Visible control label. |
| `value` | string / number | `0` | Percentage clamped to the 0–100 range. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `indeterminate` | boolean | `false` | Removes numeric ARIA range values and marks indeterminate state. |
| `aria-label` | string | `auto` | Accessible name override; otherwise the visible label supplies the name when available. |

## Contract summary

- Attributes: `label`, `value`, `icon`, `indeterminate`, `aria-label`
- Properties: `label`, `value`, `icon`, `indeterminate`, `aria-label`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
