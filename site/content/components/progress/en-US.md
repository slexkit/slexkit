---
title: "Progress"
category: Feedback
status: ready
order: 10
summary: "Progress bar."
---
# Progress

Display task completion progress controlled by value.

<!-- slex:spec-example:start component="progress" id="basic" sourceHash="d5fe2c3c" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_progress_typical",
  "layout": {
    "progress:build": {
      "label": "Build progress",
      "icon": "gear-six",
      "value": 64
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for build progress, upload progress, and task completion.
- Not suitable for indeterminate waiting states.
- Related components: `stat` for numeric metric display.
- Value range is 0-100.

## API Reference {#api}

<!-- slex:spec-api:start component="progress" sourceHash="a6111bbf" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `value` | number | No | Yes | `0` | Progress percentage from 0 to 100. |
| `label` | string | No | Yes |  | Progress label. |
| `icon` | string | No | No |  | Icon name shown before the label. |
| `indeterminate` | boolean | No | Yes | `false` | Render an indeterminate progress state without aria-valuenow. |
<!-- slex:spec-api:end -->
