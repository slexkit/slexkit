---
title: "ToolHost Step"
category: Tooling
status: ready
order: 21
summary: "ToolHost-only step page for collecting multiple human inputs inside one function call."
---
# ToolHost Step

`step` is an internal ToolHost template page. It lets one function call collect multiple input sections one page at a time. Like `submit`, it is not a public display component and should not be used in ordinary display fences or component examples.

A typical flow is: the agent emits one human-input function call, ToolHost renders one Slex card, the card switches the current `step` from release strategy to engineering constraints, and `submit:actions` returns the structured result once.

<!-- slex:spec-example:start component="step" id="basic" sourceHash="86ba4567" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_step_toolhost",
  "layout": {
    "step:strategy": {
      "title": "Release strategy",
      "index": 1,
      "radio-group:choice": {
        "options": [
          {
            "label": "Canary",
            "value": "canary"
          },
          {
            "label": "Full",
            "value": "full"
          }
        ]
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for ToolHost step-by-step questions, approval parameter panels, and multi-part human input.
- Do not use for regular page navigation, public component demos, or display-only content.
- Pair with `submit`; `step` only owns the current page structure, while `submit:actions` sends the final result.

## API Reference {#api}

<!-- slex:spec-api:start component="step" sourceHash="73e9bde2" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `title` | string | No | No |  | Step title. |
| `description` | string | No | No |  | Short helper text for the step. |
| `index` | string \| number | No | No |  | Visible step number. |
| `total` | string \| number | No | No |  | Total step count shown with index. |
| `progress` | string | No | No |  | Explicit progress label, such as 1/2. |
| `state` | string | No | No |  | Optional visual state such as current or completed. |
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
