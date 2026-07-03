---
title: "Submit"
category: Action
status: ready
order: 20
summary: "ToolHost submit control that returns current selection or form values to the host."
---
# Submit

ToolHost submit control providing submit and ignore actions.

<!-- slex:spec-example:start component="submit" id="basic" sourceHash="b5d89128" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_submit_typical",
  "layout": {
    "column:tool": {
      "input:title": {
        "value": "Release note",
        "placeholder": "Title"
      },
      "submit:done": {
        "submitLabel": "Submit",
        "ignoreLabel": "Ignore",
        "returnKeys": [
          "title"
        ]
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for AI toolchain confirmation forms, parameter panels, and selection confirmation flows.
- Not suitable for ordinary action buttons (use `button`).
- Related components: `button` for local action triggers.
- Combine with input components such as `input` and `select` to read user choices.
- Paths in `returnKeys` are read from the global state `g`.

## API Reference {#api}

<!-- slex:spec-api:start component="submit" sourceHash="1c7c766f" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `submitLabel` | string | No | No | `"Submit"` | Submit button text. |
| `ignoreLabel` | string | No | No | `"Ignore"` | Ignore button text. |
| `returnKeys` | string[] | No | No |  | State field paths returned to ToolHost. |
| `disabled` | boolean | No | Yes | `false` | Disable submit action. |
<!-- slex:spec-api:end -->
