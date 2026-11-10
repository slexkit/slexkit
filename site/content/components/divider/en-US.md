---
title: "Divider"
category: Content
status: ready
order: 35
summary: "Separator line, optionally with label."
---

# Divider

Separates adjacent content with an optional label or icon.

## HTML example

```slex
<slex-divider></slex-divider>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `""` | Optional centered divider label. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |

## Contract summary

- Attributes: `label`, `icon`
- Properties: `label`, `icon`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
