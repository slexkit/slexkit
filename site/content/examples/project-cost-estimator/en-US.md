---
title: Software Project Cost Estimator
category: Calculator
status: published
order: 6
summary: Enter team size, development timeline, and per-person cost to calculate total project cost and monthly burn rate.
tags: project, cost, estimation, management
components: card, grid, input, slider, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Software Project Cost Estimator

Cost is estimated from effort and blended hourly rate with an explicit contingency percentage.

```slex
<slex-card title="Software Project Cost Estimator"><slex-grid columns="3"><slex-input id="hours" type="number" label="Effort" unit="hours" value="480"></slex-input><slex-input id="rate" type="number" label="Blended rate" unit="USD/h" value="85"></slex-input><slex-slider id="risk" label="Contingency" unit="%" min="0" max="50" value="15"></slex-slider></slex-grid><slex-stat id="result" label="Estimated cost" unit="USD"></slex-stat></slex-card>
<script type="module">
  const fields = ["hours", "rate", "risk"].map(id => slex.root.querySelector(`#${id}`)); const result = slex.root.querySelector("#result");
  const update = () => { const [hours, rate, risk] = fields.map(field => Number(field.value)); result.value = Math.round(hours * rate * (1 + risk / 100)).toLocaleString(); };
  fields.forEach(field => field.addEventListener("input", update)); update(); slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

Stable control IDs preserve compatible input instances, while the update listener is explicitly removed with the script scope.
