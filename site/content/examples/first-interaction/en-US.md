---
title: "First Interaction: Slider Controls Data"
category: "Getting Started"
status: published
order: 2
summary: "Introduces the g object and your first slider interaction — experience reactive data binding in SlexKit."
tags: beginner, reactive, slider
components: section, slider, stat, callout, badge, column
difficulty: Beginner
runtime: trusted
featured: true
slexkitRenderMode: component
---

# First Interaction: Slider Controls Data

The previous section was all static data. To bring UI "to life," you need three things:

1. **`g` object** — reactive state container
2. **`$value` / `$label` / `$tone`** — read expressions (render values from g)
3. **`onchange`** — write expressions (user actions write to g)

```slex
{
  slex: "0.1",
  namespace: "learn_first_interaction",
  g: { count: 42 },
  layout: {
    "section:interact": {
      eyebrow: "Getting Started · 2/4",
      title: "First Interaction: Slider Controls Data",
      subtitle: "Slide the slider below, and the stat and callout will follow. This is SlexKit's reactive core.",
      "column:controls": {
        "slider:count": {
          label: "Choose a value",
          "$value": "g.count",
          min: 0,
          max: 100,
          step: 1,
          onchange: "g.count = Number($event)"
        },
        "stat:countStat": { label: "Current value", "$value": "g.count" },
        "badge:level": {
          "$label": "g.count < 30 ? 'Low' : g.count < 70 ? 'Medium' : 'High'",
          "$tone": "g.count < 30 ? 'success' : g.count < 70 ? 'warning' : 'danger'"
        },
        "callout:note": {
          "$tone": "g.count < 50 ? 'success' : 'info'",
          "$text": "g.count < 50 ? 'Current value is low — suitable for entry-level load.' : 'Current value is high — monitor resource consumption.'"
        }
      }
    }
  }
}
```

Core formula:
```
User action → onchange → g → SlexKit detects change → all $value/$tone/$text recompute → UI updates
```

This is **unidirectional data flow** + **reactive re-rendering**. No manual `setState`, no DOM manipulation needed.
