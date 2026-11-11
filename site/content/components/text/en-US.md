---
title: "Text"
category: Display
status: ready
order: 20
summary: "Short text output for status, description, and results."
---

# Text

Displays plain textual content from `text`, `content`, or `label` with variant, color, and size options.

## HTML example

```slex
<slex-text text="A short, readable description."></slex-text>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | string | `""` | Primary text content; takes precedence over text and label. |
| `text` | string | `""` | Alternate text field. Light-DOM-derived content takes precedence even when empty; prefer content or element text. |
| `label` | string | `""` | Alternate label field; the light-DOM-derived content takes precedence. Prefer content or element text. |
| `variant` | string | unset | Adds the matching text variant class. |
| `color` | string | `inherited` | CSS color value; inherits when unset. |
| `size` | string / number | `inherited` | CSS font-size; numeric values are interpreted as pixels. |

## Contract summary

- Attributes: `content`, `text`, `label`, `variant`, `color`, `size`
- Properties: `content`, `text`, `label`, `variant`, `color`, `size`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
