---
title: "Tabs"
category: Navigation
status: ready
order: 10
summary: "Tabbed view switcher."
---

# Tabs

Switches among named slotted panels or a `.tabs` array using `.value`; tab changes emit native value events.

## HTML example

```slex
<slex-tabs><section slot="overview" aria-label="Overview">Overview content</section><section slot="details" aria-label="Details">Details content</section></slex-tabs>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | scalar | `auto` | Selected tab value. Named light-DOM panels derive tabs and select the first enabled panel; property-supplied tabs require an explicit value. |
| `tabs` | array | `[]` | Property-only tab objects. Named light-DOM panels can derive this array and supply their content. |
| `orientation` | string | `horizontal` | Tab-list orientation. At 640px or less of isolated-document width, vertical tabs collapse to a horizontal scrolling list. |

Events: `input`, `change`. Use native event listeners; read interactive values from component properties.

Slots: named panels matched to item names.

## Contract summary

- Attributes: `value`, `orientation`
- Properties: `value`, `tabs`, `orientation`
- Events: `input`, `change`
- Slots: `(named panels)`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
