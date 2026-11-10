---
title: Build vs Buy Decision
category: Decision Support
status: published
order: 14
summary: A build-vs-buy decision matrix — four-dimension evaluation across feature coverage, cost, timeline, and risk with automatic recommendation.
tags: build-vs-buy, decision, procurement, cost
components: card, grid, input, slider, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Build vs Buy Decision

Compare a one-time build cost with a recurring monthly vendor price over a chosen horizon.

```slex
<slex-card title="Build vs Buy Decision"><slex-grid columns="3"><slex-input id="build" type="number" label="Build cost" value="120000"></slex-input><slex-input id="monthly" type="number" label="Buy per month" value="6500"></slex-input><slex-slider id="months" label="Horizon" unit="months" min="1" max="60" value="24"></slex-slider></slex-grid><slex-stat id="result" label="Lower-cost option"></slex-stat></slex-card>
<script type="module">
  const fields = ["build", "monthly", "months"].map(id => slex.root.querySelector(`#${id}`)); const result = slex.root.querySelector("#result");
  const update = () => { const [build, monthly, months] = fields.map(field => Number(field.value)); const buy = monthly * months; result.value = build <= buy ? `Build saves ${(buy - build).toLocaleString()}` : `Buy saves ${(build - buy).toLocaleString()}`; };
  fields.forEach(field => field.addEventListener("input", update)); update(); slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

The recommendation is derived locally from the four inputs, and listener cleanup follows the isolated module lifecycle.
