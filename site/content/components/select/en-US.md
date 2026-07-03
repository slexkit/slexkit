---
title: "Select"
category: Input
status: ready
order: 20
summary: "Single-select dropdown."
---
# Select

Single-select dropdown with options defined as an array and the current value controlled via value.

<!-- slex:spec-example:start component="select" id="basic" sourceHash="b5675bcc" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_select_typical",
  "layout": {
    "select:env": {
      "label": "Environment",
      "icon": "server",
      "value": "prod",
      "options": [
        {
          "label": "Development",
          "value": "dev",
          "icon": "code"
        },
        {
          "label": "Production",
          "value": "prod",
          "icon": "rocket-launch"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for enum selection, config items, and environment choice.
- Not suitable for small mutually exclusive groups (use `radio-group`).
- Related components: `radio-group` for smaller option sets.
- Combine with `column` to compose forms.
- Use `$value` and `onchange` for state binding.

## API Reference {#api}

<!-- slex:spec-api:start component="select" sourceHash="44dbc082" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `label` | string | No | Yes |  | Select label. |
| `icon` | string | No | No |  | Icon name shown before the top label. |
| `value` | string | No | Yes |  | Current selected value. |
| `options` | array | No | No |  | Options with label, value, and optional icon. |
| `options[].icon` | string | No | No |  | Icon name shown before an option label. |
| `placeholder` | string | No | No |  | Placeholder shown when no value is selected. |
| `disabled` | boolean | No | Yes | `false` | Disable the select trigger and native select. |
| `required` | boolean | No | Yes | `false` | Require a non-placeholder value in the native select. |
| `variant` | string: default, toolbar | No | No | `"default"` | Select surface variant. |
| `onchange` | write-expression | No | No |  | Write expression invoked when selection changes. |
<!-- slex:spec-api:end -->
