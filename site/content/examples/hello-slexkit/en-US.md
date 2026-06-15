---
title: "Your First SlexKit Card"
category: "Getting Started"
status: published
order: 1
summary: "A zero-interaction, display-only static card that demonstrates SlexKit's declarative DSL rendering."
tags: beginner, static, overview
components: section, grid, stat, table, callout
difficulty: Beginner
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Your First SlexKit Card

The core idea of SlexKit: **describe UI with declarative JSON, not just Markdown**. Below is a purely static card — no `g` object, no interaction, all content written directly in the structure.

```slex
{
  slex: "0.1",
  namespace: "learn_hello_slexkit",
  layout: {
    "section:hello": {
      eyebrow: "Getting Started · 1/4",
      title: "Your First SlexKit Card",
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
        text: "Everything you see here — titles, numbers, tables, colors — comes from the DSL declaration above, with zero HTML. This is SlexKit's core idea: Markdown provides narrative, DSL provides interaction."
      }
    }
  }
}
```

Just look and feel the structure and layout syntax. In the next section, we'll add the first piece of reactive data to the card.

---

Think about it: if `"12,847"` needs to be computed dynamically, hardcoding a string won't cut it. That's where the **`g` object** comes in — the star of the next section.
