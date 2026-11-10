---
title: "Accordion"
category: Disclosure
status: ready
order: 10
summary: "Multi-panel collapse for FAQs or grouped details."
---

# Accordion

Groups named panels into an expandable disclosure list; set `.items`/`.value` for data-driven state and use `multiple` when more than one panel may stay open.

## HTML example

```slex
<slex-accordion></slex-accordion>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | scalar / array | unset | Open item value, or an array of values when multiple is true. |
| `items` | array | `[]` | Property-only item objects. Named light-DOM panels derive items and override each item's text content. |
| `multiple` | boolean | `false` | Allows more than one item to remain open. |

Events: `input`, `change`. Use native event listeners; read interactive values from component properties.

Slots: named panels matched to item names.

## Contract summary

- Attributes: `value`, `multiple`
- Properties: `value`, `items`, `multiple`
- Events: `input`, `change`
- Slots: `(named panels)`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
