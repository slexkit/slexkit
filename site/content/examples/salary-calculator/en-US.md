---
title: Social Insurance Calculator
category: Calculator
status: published
order: 5
summary: Enter a salary and city to calculate China's social insurance breakdown — showing personal contributions, employer contributions, and take-home pay.
tags: salary, insurance, calculator, hr
components: card, grid, input, slider, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Social Insurance Calculator

Adjust the contribution rate to estimate the employee deduction and remaining pay.

```slex
<slex-card title="Social Insurance Calculator"><slex-grid columns="2"><slex-input id="salary" type="number" label="Monthly salary" value="18000"></slex-input><slex-slider id="rate" label="Employee contribution" unit="%" min="0" max="30" step="0.1" value="10.5"></slex-slider></slex-grid><slex-grid columns="2"><slex-stat id="deduction" label="Deduction"></slex-stat><slex-stat id="remaining" label="Remaining before tax"></slex-stat></slex-grid></slex-card>
<script type="module">
  const salary = slex.root.querySelector("#salary"); const rate = slex.root.querySelector("#rate"); const deduction = slex.root.querySelector("#deduction"); const remaining = slex.root.querySelector("#remaining");
  const update = () => { const amount = Number(salary.value) * Number(rate.value) / 100; deduction.value = amount.toFixed(2); remaining.value = (Number(salary.value) - amount).toFixed(2); };
  salary.addEventListener("input", update); rate.addEventListener("input", update); update(); slex.onDispose(() => { salary.removeEventListener("input", update); rate.removeEventListener("input", update); });
</script>
```

The salary and contribution rate remain live control values; recalculation updates only the displayed deduction and remainder.
