---
title: "Branching: Mode Selector"
category: "Getting Started"
status: published
order: 4
summary: "Use select to switch the mode state and render different inputs and results."
tags: select, branching, conditional
components: section, select, input, slider, stat, callout, column
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Branching: Mode Selector

`select` switches the `mode` state; the current mode determines which inputs and results render.

The pattern is `UI = f(state)`: change `mode`, and the view switches with it.

```slex
{
  slex: "0.1",
  namespace: "learn_tabs_branching",
  g: {
    mode: "length",
    value: 100,
    convert: function () {
      if (this.mode === "length") return (this.value / 100).toFixed(2) + " m";
      if (this.mode === "weight") return (this.value * 2.20462).toFixed(2) + " lbs";
      if (this.mode === "temp") return (this.value * 9 / 5 + 32).toFixed(1) + " °F";
      return "—";
    },
    label: function () {
      if (this.mode === "length") return "cm to m";
      if (this.mode === "weight") return "kg to lbs";
      return "°C to °F";
    }
  },
  layout: {
    "section:branching": {
      eyebrow: "Getting Started · 4/4",
      title: "Branching: Mode Selector",
      subtitle: "Switch modes below — the input parameters and results change with it. One mode = one UI state.",
      "select:mode": {
        label: "Conversion mode",
        "$value": "g.mode",
        options: [
          { label: "Length (cm → m)", value: "length" },
          { label: "Weight (kg → lbs)", value: "weight" },
          { label: "Temperature (°C → °F)", value: "temp" }
        ],
        onchange: "g.mode = String($event)"
      },
      "input:value": { label: "Input value", "$value": "g.value", type: "number", onchange: "g.value = Number($event || 0)" },
      "stat:result": { "$label": "g.label()", "$value": "g.convert()" },
      "callout:guide": {
        "$tone": "g.mode === 'temp' ? 'warning' : 'info'",
        "$text": "g.mode === 'length' ? '1 meter = 100 cm; divide by 100.' : g.mode === 'weight' ? '1 kg ≈ 2.20462 lbs.' : '°F = °C × 9/5 + 32. Fahrenheit values use a wider numeric range.'"
      }
    }
  }
}
```
