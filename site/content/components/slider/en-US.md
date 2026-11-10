---
title: "Slider"
category: Input
status: ready
order: 60
summary: "Numeric range input."
---

# Slider

Provides a bounded numeric control with min/max/step and orientation, emitting continuous `input` and committed `change` events.

## HTML example

```slex
<slex-slider></slex-slider>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `""` | Visible control label. |
| `unit` | string | `""` | Unit text shown with the value when the component supports it. |
| `description` | string | `""` | Exposed for contract consistency, but this component does not currently render it. |
| `disabled` | boolean | `false` | Disables user interaction. |
| `name` | string | unset | Name used when the custom element participates in a native form. |
| `value` | number | `0` | Current numeric value; the browser clamps and step-aligns assignments. |
| `aria-label` | string | `auto` | Accessible name override; otherwise the visible label supplies the name when available. |
| `min` | string / number | `0` | Minimum range value. |
| `max` | string / number | `100` | Maximum range value. |
| `step` | string / number | `1` | Range step size. |
| `orientation` | string | `horizontal` | Sets the orientation data marker; the current native range and styling remain horizontal. |
| `valueAsNumber` | number | `0` | Read-only JavaScript property exposing the current numeric value after browser clamping and step alignment. |

Events: `input`, `change`. Use native event listeners; read interactive values from component properties.

## Contract summary

- Attributes: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `min`, `max`, `step`, `orientation`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `min`, `max`, `step`, `orientation`
- Events: `input`, `change`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
