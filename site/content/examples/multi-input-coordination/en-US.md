---
title: "Multi-Input Coordination"
category: "Getting Started"
status: published
order: 3
summary: "An input and slider feed one JavaScript calculation through native input events."
tags: reactive, coordinated, formula
components: card, grid, input, slider, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Multi-Input Coordination

Two live controls feed one ordinary JavaScript update function, which writes calculated values back through component properties.

```slex
<slex-card title="Multi-Input Coordination"><slex-grid columns="2"><slex-input id="left" label="Value A" value="10"></slex-input><slex-slider id="right" label="Value B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="Result"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

Both listeners share one cleanup scope, and no expression evaluator or implicit binding graph is involved.
