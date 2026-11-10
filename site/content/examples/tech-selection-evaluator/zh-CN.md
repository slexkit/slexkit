---
title: 技术选型评估
category: 决策辅助
status: published
order: 13
summary: 从性能、生态、学习和维护四个维度评估技术方案，调整评分并查看加权结果。
tags: tech, selection, evaluation, decision
components: card, grid, select, slider, stat, text
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 技术选型评估

选择一组示例评分，再按团队需求调整四个维度。下方结果只是演示性的加权计算，不代表对任何框架的客观排名。

```slex
<slex-card title="技术选型评估">
  <slex-select id="technology" label="技术栈"><option value="react">React</option><option value="vue">Vue</option><option value="svelte">Svelte</option><option value="angular">Angular</option></slex-select>
  <slex-grid columns="2">
    <slex-slider id="performance" label="性能（30%）" value="85" min="0" max="100" step="5"></slex-slider>
    <slex-slider id="ecosystem" label="生态（25%）" value="95" min="0" max="100" step="5"></slex-slider>
    <slex-slider id="learning" label="学习（20%）" value="70" min="0" max="100" step="5"></slex-slider>
    <slex-slider id="maintenance" label="维护（25%）" value="80" min="0" max="100" step="5"></slex-slider>
  </slex-grid>
  <slex-stat id="score" label="综合评分" unit="分"></slex-stat>
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
    get("recommendation").text = score >= 85 ? "示例评分：强烈推荐" : score >= 75 ? "示例评分：推荐" : score >= 60 ? "示例评分：可以考虑" : "示例评分：建议谨慎";
  };
  const choose = () => { (presets[get("technology").value] || presets.react).forEach((value, i) => { get(ids[i]).value = value; }); update(); };
  get("technology").addEventListener("change", choose);
  ids.forEach(id => get(id).addEventListener("input", update));
  update();
  slex.onDispose(() => { get("technology").removeEventListener("change", choose); ids.forEach(id => get(id).removeEventListener("input", update)); });
</script>
```

权重依次为 30%、25%、20% 和 25%。评分是本地示例数据，可以根据自己的决策标准调整。
