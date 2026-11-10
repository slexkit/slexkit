---
title: "Input"
category: Input
status: ready
order: 10
summary: "Single-line text or engineering value input."
---

# Input

Collects text, numeric, or engineering-unit input through `.value`; read `.valueAsNumber` when numeric parsing is needed.

## HTML example

```slex
<slex-input id="value" label="Project" value="SlexKit" placeholder="Enter name" description="Visible labels keep form fields scannable."></slex-input>
```

## API Reference

Defaults below describe the rendered control when an attribute is omitted. Boolean attributes use presence: remove `disabled` to enable the input; `disabled="false"` still disables it.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string / number | `""` | Current input value. User edits expose the source text; assigning a number also updates the field. |
| `valueAsNumber` | number | `NaN` | Read-only JavaScript property. Parses engineering prefixes when `type="engineering"`; empty or invalid text returns `NaN`. |
| `label` | string | `""` | Visible label associated with the native input. |
| `description` | string | `""` | Helper text below the input, connected through `aria-describedby`. |
| `placeholder` | string | `""` | Hint shown inside an empty input. Keep a visible label as well. |
| `type` | string | `text` | Native input type, or `engineering` for values such as `4.7kΩ`. Engineering mode uses a text input. |
| `unit` | string | `""` | Trailing unit label; it does not convert the input value. |
| `disabled` | boolean | `false` | Disables user editing and native form participation. |
| `readOnly` / `readonly` | boolean | `false` | Prevents editing while keeping the field readable and focusable. |
| `required` | boolean | `false` | Enables native required-value validation. |
| `invalid` | boolean | `false` | Marks the input invalid. A non-empty `error` also sets the invalid state. |
| `error` | string | `""` | Validation message linked to the input with `aria-describedby`. |
| `name` | string | unset | Name used when participating in a native form. |
| `min` | string / number | unset | Native minimum constraint for input types that support it. |
| `max` | string / number | unset | Native maximum constraint for input types that support it. |
| `step` | string / number | unset | Native step constraint, including `any` where supported. |
| `aria-label` | string | inferred | Accessible name override. Without it, the visible label or placeholder supplies the name. |

Listen for native `input` and `change` events on `<slex-input>` and read `event.currentTarget.value` or `.valueAsNumber`.

## Contract summary

- Attributes: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `type`, `placeholder`, `readonly`, `required`, `invalid`, `error`, `min`, `max`, `step`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `type`, `placeholder`, `readOnly`, `required`, `invalid`, `error`, `min`, `max`, `step`
- Events: `input`, `change`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
