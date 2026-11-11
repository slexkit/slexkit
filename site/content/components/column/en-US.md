---
title: "Column"
category: Layout
status: ready
order: 20
summary: "Vertical layout container for forms, text, and control groups."
---

# Column

Stacks slotted children vertically using the component layout styles.

## HTML example

```slex
<slex-column>
  <slex-stat label="Voltage" value="12" unit="V"></slex-stat>
  <slex-stat label="Current" value="2" unit="A"></slex-stat>
</slex-column>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `default` (slot) | Node[] | empty | Place ordinary HTML or custom elements in the default slot for vertical layout; there are no component-specific properties. |

## Contract summary

- Attributes: none
- Properties: none
- Events: none
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
