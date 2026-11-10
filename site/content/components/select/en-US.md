---
title: "Select"
category: Input
status: ready
order: 20
summary: "Single-select dropdown."
---

# Select

Provides a select control whose `.options` array defines choices and whose `.value` tracks the selection.

## HTML example

```slex
<slex-select label="Environment"><option value="dev">Development</option><option value="prod">Production</option></slex-select>
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
| `value` | string / number | `""` | Selected option value. Light-DOM option children derive the first enabled value; property-supplied options do not auto-select. |
| `aria-label` | string | `auto` | Accessible name when no visible label is provided. |
| `options` | array | `[]` | Property-only { label, value, disabled, icon } option objects; light-DOM option children are also derived. |
| `placeholder` | string | `"Select..."` | Text shown when no option is selected. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `variant` | string | `default` | Visual variant; toolbar enables the compact toolbar treatment. |
| `required` | boolean | `false` | Requires a value for native form validity. |

Events: `input`, `change`. Use native event listeners; read interactive values from component properties.

## Contract summary

- Attributes: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `placeholder`, `icon`, `variant`, `required`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `options`, `placeholder`, `icon`, `variant`, `required`
- Events: `input`, `change`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
