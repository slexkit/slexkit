---
title: "Slider"
category: Input
status: ready
order: 60
summary: "Numeric range input."
---
# Slider

Numeric range selection with min, max, step control and unit display.

<!-- slex:spec-example:start component="slider" id="basic" sourceHash="a0525d92" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_slider_typical",
  "layout": {
    "slider:volume": {
      "label": "Volume",
      "icon": "speaker-high",
      "value": 42,
      "min": 0,
      "max": 100,
      "step": 1,
      "unit": "%"
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for volume, brightness, threshold, and percentage adjustments.
- Not suitable for precise text entry (use `input`).
- Related components: `input` for text input.
- Use `$value` and `onchange` for state binding.

## API Reference {#api}

<!-- slex:spec-api:start component="slider" sourceHash="0939dc16" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `label` | string | No | Yes |  | Slider label. |
| `icon` | string | No | No |  | Icon name shown before the label. |
| `value` | number | No | Yes | `0` | Current numeric value. |
| `min` | number | No | Yes | `0` | Minimum value. |
| `max` | number | No | Yes | `100` | Maximum value. |
| `step` | number | No | Yes | `1` | Step interval. |
| `unit` | string | No | Yes |  | Unit shown after the value. |
| `disabled` | boolean | No | Yes | `false` | Disable the range input. |
| `orientation` | string: horizontal, vertical | No | No | `"horizontal"` | Slider orientation metadata used for styling. |
| `haptic` | boolean | No | No | `true` | Enable vibration feedback on supported devices. |
| `haptics` | boolean | No | No | `true` | Alias for haptic. |
| `onchange` | write-expression | No | No |  | Write expression invoked when the value changes. |
<!-- slex:spec-api:end -->
