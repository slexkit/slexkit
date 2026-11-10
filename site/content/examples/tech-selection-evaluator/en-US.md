---
title: Technology Selection Evaluator
category: Decision Support
status: published
order: 13
summary: Compare example technology scores across performance, ecosystem, learning, and maintenance.
tags: tech, selection, evaluation, decision
components: card, grid, select, slider, stat, text
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Technology Selection Evaluator

Choose a set of example scores, then adjust each dimension for your team. The weighted result is an illustration, not an objective ranking of frameworks.

```slex
<slex-card title="Technology selection">
  <slex-select id="technology" label="Technology"><option value="react">React</option><option value="vue">Vue</option><option value="svelte">Svelte</option><option value="angular">Angular</option></slex-select>
  <slex-grid columns="2">
    <slex-slider id="performance" label="Performance (30%)" value="85" min="0" max="100" step="5"></slex-slider>
    <slex-slider id="ecosystem" label="Ecosystem (25%)" value="95" min="0" max="100" step="5"></slex-slider>
    <slex-slider id="learning" label="Learning (20%)" value="70" min="0" max="100" step="5"></slex-slider>
    <slex-slider id="maintenance" label="Maintenance (25%)" value="80" min="0" max="100" step="5"></slex-slider>
  </slex-grid>
  <slex-stat id="score" label="Weighted score" unit="points"></slex-stat>
  <slex-text id="recommendation"></slex-text>
</slex-card>
<script type="module">
  const get = id => slex.root.querySelector(`#${id}`);
  const ids = ["performance", "ecosystem", "learning", "maintenance"];
  const presets = { react: [85, 95, 70, 80], vue: [80, 85, 85, 85], svelte: [95, 70, 90, 90], angular: [80, 80, 60, 75] };
  const update = () => {
    const values = ids.map(id => Number(get(id).value));
    const score = values[0] * 0.3 + values[1] * 0.25 + values[2] * 0.2 + values[3] * 0.25;
    get("score").value = score.toFixed(1);
    get("recommendation").text = score >= 85 ? "Example result: strongly recommended" : score >= 75 ? "Example result: recommended" : score >= 60 ? "Example result: worth considering" : "Example result: proceed with caution";
  };
  const choose = () => { (presets[get("technology").value] || presets.react).forEach((value, i) => { get(ids[i]).value = value; }); update(); };
  get("technology").addEventListener("change", choose);
  ids.forEach(id => get(id).addEventListener("input", update));
  update();
  slex.onDispose(() => { get("technology").removeEventListener("change", choose); ids.forEach(id => get(id).removeEventListener("input", update)); });
</script>
```

The weights are 30%, 25%, 20%, and 25%. The local sample scores can be adjusted to match your own decision criteria.
