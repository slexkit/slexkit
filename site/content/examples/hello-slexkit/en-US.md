---
title: "First SlexKit Card"
category: "Getting Started"
status: published
order: 1
summary: "A static SlexKit card using section, grid, stat, table, and callout."
tags: beginner, static, overview
components: section, grid, stat, table, callout
difficulty: Beginner
runtime: trusted
featured: true
slexkitRenderMode: component
---

# First SlexKit Card

A static SlexKit card can be declared entirely in `layout` without a `g` object or interaction handlers.

```slex
{
  slex: "0.1",
  namespace: "learn_hello_slexkit",
  layout: {
    "section:hello": {
      eyebrow: "Getting Started · 1/4",
      title: "First SlexKit Card",
      subtitle: "Everything is declarative — numbers, colors, layout, all from the DSL.",
      "grid:top-stats": {
        columns: 1, mdColumns: 3,
        "stat:users": { label: "Active Users", value: "12,847", unit: "" },
        "stat:uptime": { label: "Uptime", value: "99.97", unit: "%" },
        "stat:latency": { label: "Latency", value: "42", unit: "ms" }
      },
      "table:pricing": {
        columns: ["Feature", "Free", "Pro"],
        rows: [
          ["Components", "All", "All"],
          ["Custom themes", "3", "Unlimited"],
          ["Data export", "JSON", "JSON / CSV / SQL"]
        ]
      },
      "callout:tip": {
        tone: "info",
        text: "Titles, numbers, tables, and colors all come from the DSL declaration above. Markdown carries the prose; the DSL carries the interactive structure."
      }
    }
  }
}
```

Start with the component keys and nesting structure. The next section adds reactive data to the same shape.

---

If `"12,847"` needs to be computed, move that value into `g` and read it through an expression.
