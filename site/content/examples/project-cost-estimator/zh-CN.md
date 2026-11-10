---
title: 软件项目成本估算器
category: 计算器
status: published
order: 6
summary: 输入团队规模、开发周期和人员成本，计算项目总成本和人均成本。
tags: project, cost, estimation, management
components: card, grid, input, slider, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 软件项目成本估算器

成本由工作量、综合时薪与显式风险预留比例估算。

```slex
<slex-card title="软件项目成本估算器"><slex-grid columns="3"><slex-input id="hours" type="number" label="工作量" unit="小时" value="480"></slex-input><slex-input id="rate" type="number" label="综合时薪" unit="元/小时" value="600"></slex-input><slex-slider id="risk" label="风险预留" unit="%" min="0" max="50" value="15"></slex-slider></slex-grid><slex-stat id="result" label="预计成本" unit="元"></slex-stat></slex-card>
<script type="module">
  const fields = ["hours", "rate", "risk"].map(id => slex.root.querySelector(`#${id}`)); const result = slex.root.querySelector("#result");
  const update = () => { const [hours, rate, risk] = fields.map(field => Number(field.value)); result.value = Math.round(hours * rate * (1 + risk / 100)).toLocaleString(); };
  fields.forEach(field => field.addEventListener("input", update)); update(); slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

稳定控件 ID 可保留兼容输入实例，更新监听器则随脚本作用域显式移除。
