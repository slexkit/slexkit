---
title: "Collapsible"
category: Disclosure
status: ready
order: 20
summary: "Single expandable content area."
---

# Collapsible

Shows or hides one slotted content region through `.open`, with configurable trigger text and icon.

## HTML example

```slex
<slex-collapsible></slex-collapsible>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Current expanded state. |
| `trigger` | string | `"Toggle"` | Trigger button label. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `content` | string | `""` | Text rendered in the panel alongside default-slot children. |

Events: `input`, `change`. Use native event listeners; read interactive values from component properties.

Slots: default slot accepting ordinary HTML or custom elements.

## Contract summary

- Attributes: `open`, `trigger`, `icon`, `content`
- Properties: `open`, `trigger`, `icon`, `content`
- Events: `input`, `change`
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
