---
title: "Multi-Input Coordination: Two Linked Sliders"
category: "Getting Started"
status: published
order: 3
summary: "Two sliders that affect each other — introduces g methods, the formula component, and conditional rendering."
tags: reactive, coordinated, formula
components: section, slider, input, stat, formula, badge, callout, grid, column
difficulty: Beginner
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Multi-Input Coordination: Two Linked Sliders

Real-world scenarios often have multiple input variables that affect each other. This requires two new concepts:
1. **`g.method()`** — computed values that depend on other state (like Vue's computed)
2. **`$if`** — conditional rendering (show or hide components based on state)

```slex
{
  slex: "0.1",
  namespace: "learn_multi_coordination",
  g: {
    width: 120,
    height: 80,
    area: function () { return this.width * this.height; },
    isLandscape: function () { return this.width > this.height; },
    ratio: function () { return (this.width / this.height).toFixed(2); }
  },
  layout: {
    "section:coordinated": {
      eyebrow: "Getting Started · 3/4",
      title: "Multi-Input Coordination: Rectangle Size",
      subtitle: "Adjust both width and height — area and aspect ratio recalculate automatically. This is the power of g methods.",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:w": {
          "input:width": { label: "Width", "$value": "g.width", type: "number", unit: "px", onchange: "g.width = Number($event || 0)" },
          "slider:width": { label: "Width", "$value": "g.width", min: 20, max: 300, step: 5, unit: "px", onchange: "g.width = Number($event)" }
        },
        "column:h": {
          "input:height": { label: "Height", "$value": "g.height", type: "number", unit: "px", onchange: "g.height = Number($event || 0)" },
          "slider:height": { label: "Height", "$value": "g.height", min: 20, max: 300, step: 5, unit: "px", onchange: "g.height = Number($event)" }
        }
      },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:area": { label: "Area", "$value": "g.area()", unit: "px²" },
        "stat:ratio": { label: "Aspect Ratio", "$value": "g.ratio()" },
        "badge:orientation": {
          "$label": "g.isLandscape() ? 'Landscape' : g.width === g.height ? 'Square' : 'Portrait'",
          "$tone": "g.isLandscape() ? 'info' : g.width === g.height ? 'success' : 'warning'"
        }
      },
      "formula:areaEq": { "$tex": "'\\\\text{Area} = ' + g.width + ' \\\\times ' + g.height + ' = ' + g.area() + '\\\\text{ px}^2'" },
      "callout:tip": {
        "$tone": "g.isLandscape() ? 'info' : 'warning'",
        "$text": "g.isLandscape() ? 'Currently landscape — better suited for widescreen displays.' : 'Currently portrait — better suited for mobile reading.'"
      },
      "callout:squareTip": {
        "$if": "g.width === g.height",
        tone: "success",
        text: "It's a square! Width and height are exactly equal."
      }
    }
  }
}
```

**Three new concepts:**

| Concept | Syntax | Meaning |
|:---|:---|:---|
| g method | `area: function() { return this.width * this.height; }` | `this` refers to the g object itself, returns a dynamically computed value |
| Dynamic formula | `"$tex": "'...' + g.width + '...'"` | The formula component renders KaTeX in real-time based on g values |
| Conditional rendering | `"$if": "g.width === g.height"` | The component only renders when the expression returns true |
