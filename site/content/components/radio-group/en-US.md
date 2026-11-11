---
title: "Radio Group"
category: Input
status: ready
order: 70
summary: "Mutually exclusive radio selection."
---

# Radio Group

Offers one choice from an `.options` array, exposes the selected `.value`, and emits native value events.

## HTML example

```slex
<slex-radio-group label="Environment" value="dev">
  <option value="dev">Development</option>
  <option value="prod">Production</option>
</slex-radio-group>
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
| `value` | string / number | `""` | Selected option value. Neither property-supplied nor light-DOM-derived options auto-select a value. |
| `aria-label` | string | `auto` | Accessible name when no visible label is provided. |
| `options` | array | `[]` | Property-only { label, value, description, disabled, icon } option objects; light-DOM option children are also derived. |
| `orientation` | string | `vertical` | Layout orientation; horizontal places choices in a wrapping row. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `variant` | string | unset | Visual variant; list renders card-like options. |
| `required` | boolean | `false` | Requires a value for native form validity. |

Events: `input`, `change`. Use native event listeners; read interactive values from component properties.

## Contract summary

- Attributes: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `orientation`, `icon`, `variant`, `required`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `options`, `orientation`, `icon`, `variant`, `required`
- Events: `input`, `change`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
