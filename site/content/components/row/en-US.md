---
title: "Row"
category: Layout
status: ready
order: 30
summary: "Horizontal layout container for toolbars, status lines, and button groups."
---

# Row

Automatically balances rows of metric tiles or cards. Mixed content uses a flex row with configurable gap, alignment, and justification.

## HTML example

```slex
<slex-row>
  <slex-stat label="Supply voltage" value="12" unit="V"></slex-stat>
  <slex-stat label="Measured current" value="2.5" unit="A"></slex-stat>
  <slex-stat label="Calculated output power" value="30" unit="W"></slex-stat>
</slex-row>
```

Two or more direct `slex-stat` children, or direct `slex-card` children, share responsive balanced columns. The last row fills the width; tiles in each row share a height. Metric values align at the bottom even when a label wraps. Children retain their DOM identity and values during resizing, reordering, insertion and removal. Set `align` or `justify` explicitly for normal flex layout. Use Grid when you want declared column counts.

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `gap` | string | `1rem` | CSS length used between children; unitless token integers are not supported. |
| `align` | string | `stretch` | CSS align-items value. When omitted, same-kind stat/card children balance automatically with equal row heights. Explicit align or justify selects normal flex layout. |
| `justify` | string | `normal` | CSS justify-content value. |

Slots: default slot accepting ordinary HTML or custom elements.

## Contract summary

- Attributes: `gap`, `align`, `justify`
- Properties: `gap`, `align`, `justify`
- Events: none
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
