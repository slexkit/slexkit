---
title: "Project Dashboard"
category: "Dashboard"
status: published
order: 11
summary: "Build an information dashboard with section + grid — covering Sprint progress, quality metrics, and team health with multi-card coordination."
tags: dashboard, sprint, metrics, team
components: card, grid, input, slider, stat
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Project Dashboard

The dashboard composes cards, grids, controls, and stats while one JavaScript update function coordinates the displayed project metrics.

```slex
<slex-card title="Project Dashboard"><slex-grid columns="2"><slex-input id="left" label="Value A" value="10"></slex-input><slex-slider id="right" label="Value B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="Result"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

The values stay in component properties and ordinary JavaScript; no hidden namespace store or expression evaluator participates.
