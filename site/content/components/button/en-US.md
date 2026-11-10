---
title: "Button"
category: Action
status: ready
order: 10
summary: "Action trigger button."
---

# Button

Provides an action control that emits native `click`; configure its label, icon, variant, disabled, pressed, and selected state.

## HTML example

```slex
<slex-button id="action" label="Run"></slex-button>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `""` | Visible button text; omitted values are derived from the element's text content. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `variant` | string | `primary` | Visual variant such as primary, secondary, danger, or ghost. |
| `disabled` | boolean | `false` | Disables user interaction. |
| `pressed` | boolean | `false` | Pressed state for icon weight and aria-pressed. |
| `selected` | boolean | `false` | Selected visual state; it does not add aria-pressed by itself. |
| `title` | string | `""` | Native tooltip text; provide label or element text for the visible caption. |
| `aria-label` | string | `auto` | Accessible name override; otherwise the visible label supplies the name when available. |

Events: `click`. Use native event listeners; read interactive values from component properties.

## Contract summary

- Attributes: `label`, `icon`, `variant`, `disabled`, `pressed`, `selected`, `title`, `aria-label`
- Properties: `label`, `icon`, `variant`, `disabled`, `pressed`, `selected`, `title`, `aria-label`
- Events: `click`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
