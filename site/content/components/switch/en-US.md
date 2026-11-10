---
title: "Switch"
category: Input
status: ready
order: 40
summary: "Boolean toggle input for instant settings."
---

# Switch

Represents an on/off setting through `.enabled`/`.checked` and native `input`/`change` events.

## HTML example

```slex
<slex-switch></slex-switch>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `""` | Visible control label. |
| `unit` | string | `""` | Exposed for contract consistency, but this component does not currently render it. |
| `description` | string | `""` | Exposed for contract consistency, but this component does not currently render it. |
| `disabled` | boolean | `false` | Disables user interaction. |
| `name` | string | unset | Name used when the custom element participates in a native form. |
| `value` | string / number | `"on"` | Value submitted when enabled; defaults to on when no value was assigned. Use enabled or checked to control the state. |
| `aria-label` | string | `auto` | Accessible name override; otherwise the visible label supplies the name when available. |
| `checked` | boolean | `false` | Alias of enabled; the wrapper keeps both states synchronized. |
| `enabled` | boolean | `false` | Current on/off state; synchronized with checked. |

Events: `input`, `change`. Use native event listeners; read interactive values from component properties.

## Contract summary

- Attributes: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `checked`, `enabled`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `checked`, `enabled`
- Events: `input`, `change`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
