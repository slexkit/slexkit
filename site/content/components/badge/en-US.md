---
title: "Badge"
category: Content
status: ready
order: 10
summary: "Compact label for status or classification."
---

# Badge

Displays compact status or category text with optional icon, tone, and visual variant.

## HTML example

```slex
<slex-badge></slex-badge>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `""` | Primary badge text. |
| `text` | string | `""` | Alternate badge text; the light-DOM-derived label takes precedence. Prefer label or element text. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `tone` | string | `neutral` | Badge tone; danger and error normalize to destructive. |
| `variant` | string | `neutral` | Fallback tone alias used only when tone is unset. |

## Contract summary

- Attributes: `label`, `text`, `icon`, `tone`, `variant`
- Properties: `label`, `text`, `icon`, `tone`, `variant`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
