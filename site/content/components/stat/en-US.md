---
title: "Stat"
category: Display
status: ready
summary: "Metric display with label, value, unit, and semantic tone."
---
# Stat

Present a labeled metric value with optional unit and semantic tone.

<!-- slex:spec-example:start component="stat" id="basic" sourceHash="9fa58aeb" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_stat_typical",
  "layout": {
    "grid:stats": {
      "columns": 2,
      "stat:requests": {
        "label": "Requests",
        "icon": "activity",
        "value": "1.2k",
        "unit": "/min"
      },
      "stat:success": {
        "label": "Success",
        "icon": "check-circle",
        "value": "98.4",
        "unit": "%",
        "tone": "success"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for data dashboards, metric overviews, and key indicator displays.
- Not suitable for long text (use `text`) or interactive input (use `input`).
- Related components: `text` for text output, `badge` for label status.
- Stats are typically used inside a `grid` or `row`.
- Use `tone` only for semantic state, not as an arbitrary style picker.

### Tone variants

```slex
{
  namespace: "doc_stat_tone_diff",
  layout: {
    "row:tones": {
      "stat:info": {
        label: "Info",
        value: "42",
        tone: "info"
      },
      "stat:success": {
        label: "Success",
        value: "98%",
        tone: "success"
      },
      "stat:warning": {
        label: "Warning",
        value: "73",
        tone: "warning"
      },
      "stat:danger": {
        label: "Danger",
        value: "5",
        tone: "danger"
      },
      "stat:muted": {
        label: "Muted",
        value: "0",
        tone: "muted"
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="stat" sourceHash="389443e6" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `label` | string | No | Yes |  | Metric label. |
| `icon` | string | No | No |  | Icon name shown before the label. |
| `value` | string \| number | No | Yes |  | Metric value. |
| `unit` | string | No | Yes |  | Unit shown after the value. |
| `tone` | string: info, success, warning, danger, muted | No | No |  | Optional semantic tone. |
| `animateInitial` | boolean | No | No | `false` | Animate the initial rendered value. |
<!-- slex:spec-api:end -->
