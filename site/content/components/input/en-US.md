---
title: "Input"
category: Input
status: ready
summary: "Single-line text or engineering value input."
---
# Input

Single-line text input with controlled value, placeholder, label, description, native types, engineering input, and disabled state.

<!-- slex:spec-example:start component="input" id="basic" sourceHash="4215f98a" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_input_typical",
  "layout": {
    "input:name": {
      "label": "Project",
      "value": "SlexKit",
      "placeholder": "Enter name",
      "description": "Visible labels keep form fields scannable."
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for name input, search boxes, email/password, and other single-line text.
- Use `type: "engineering"` for values such as `4.7k`, `2.2uF`, or `1e-3`.
- Not suitable for numeric range selection (use `slider`).
- Related components: `select` for option selection, `slider` for numeric ranges.
- Typically placed inside a `column` to compose forms.
- Use `$value` and `onchange` for state binding.
- Numeric inputs show decrement and increment buttons by default. Use `step`, `min`, and `max` to define quick-adjust behavior, or set `controls: false` to hide them.
- `onchange` fires when the user edits the value or clicks a step control.
- `type: "number"` still emits a string value. Convert with `Number($event)` or use `type: "engineering"` to read parsed results.
- Use `invalid` plus `error` for validation feedback. Error text is linked through `aria-describedby`.

### Label and unit

`label` renders as a clickable native label; `unit` renders as trailing text, suitable for voltage, resistance, frequency, etc.

```slex
{
  namespace: "doc_input_label_unit",
  layout: {
    "input:voltage": {
      label: "Voltage",
      value: "3.3",
      unit: "V",
      description: "Supply rail"
    }
  }
}
```

### Disabled state

```slex
{
  namespace: "doc_input_disabled_diff",
  layout: {
    "row:diff": {
      "input:enabled": {
        value: "Editable",
        placeholder: "Type here"
      },
      "input:disabled": {
        value: "Disabled",
        disabled: true
      }
    }
  }
}
```

### Engineering input

`type: "engineering"` uses a text input (not the native number type). Component state retains the raw string and additionally exposes parsed results:

```slex
{
  namespace: "doc_input_engineering",
  layout: {
    "input:resistance": {
      type: "engineering",
      value: "4.7kΩ"
    },
    "stat:parsed": {
      label: "Parsed value",
      $value: "resistance.valid ? resistance.number : 'Invalid'",
      $unit: "resistance.unit"
    }
  }
}
```

Supports scientific notation and SI prefixes: `p`, `n`, `u`, `µ`, `m`, `k`, `K`, `M`, `meg`, `G`, `T`. Units are captured but not converted across physical dimensions.

## API Reference {#api}

<!-- slex:spec-api:start component="input" sourceHash="08bdd046" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `value` | string | No | Yes |  | Current input value. |
| `label` | string | No | Yes |  | Input label. |
| `unit` | string | No | Yes |  | Trailing unit text. |
| `description` | string | No | Yes |  | Assistive description below the input. |
| `help` | string | No | Yes |  | Alias for description. |
| `hint` | string | No | Yes |  | Alias for description. |
| `error` | string | No | Yes |  | Error text shown below the input and linked with aria-describedby. |
| `errorMessage` | string | No | Yes |  | Alias for error. |
| `invalid` | boolean | No | Yes | `false` | Mark the input as invalid with aria-invalid and error styling. |
| `placeholder` | string | No | No |  | Placeholder text for empty values. |
| `type` | string | No | No | `"text"` | Input value kind; use engineering for parsed engineering values. |
| `disabled` | boolean | No | Yes | `false` | Disable editing. |
| `readonly` | boolean | No | Yes | `false` | Make the input read-only. |
| `readOnly` | boolean | No | Yes | `false` | Alias for readonly. |
| `required` | boolean | No | Yes | `false` | Mark the input as required. |
| `id` | string | No | No |  | Native input id; defaults to a stable id derived from the component name. |
| `name` | string | No | No |  | Native input name attribute. |
| `min` | string \| number | No | Yes |  | Minimum value used by numeric input controls. |
| `max` | string \| number | No | Yes |  | Maximum value used by numeric input controls. |
| `step` | string \| number | No | Yes |  | Step size used by numeric input controls. |
| `controls` | boolean | No | Yes | `true` | Show decrement and increment buttons for numeric inputs. |
| `onchange` | write-expression | No | No |  | Write expression invoked when the value changes. |
<!-- slex:spec-api:end -->
