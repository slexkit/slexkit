---
title: 自建还是外购决策
category: 决策辅助
status: published
order: 14
summary: 自建还是外购决策矩阵——功能覆盖、成本对比、时间线、风险四维度评估，自动推荐方案。
tags: build-vs-buy, decision, procurement, cost
components: card, grid, input, slider, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 自建还是外购决策

在选定周期内比较一次性自建成本与按月外购费用。

```slex
<slex-card title="自建还是外购决策"><slex-grid columns="3"><slex-input id="build" type="number" label="自建成本" value="800000"></slex-input><slex-input id="monthly" type="number" label="每月外购费用" value="42000"></slex-input><slex-slider id="months" label="评估周期" unit="月" min="1" max="60" value="24"></slex-slider></slex-grid><slex-stat id="result" label="成本更低方案"></slex-stat></slex-card>
<script type="module">
  const fields = ["build", "monthly", "months"].map(id => slex.root.querySelector(`#${id}`)); const result = slex.root.querySelector("#result");
  const update = () => { const [build, monthly, months] = fields.map(field => Number(field.value)); const buy = monthly * months; result.value = build <= buy ? `自建节省 ${(buy - build).toLocaleString()}` : `外购节省 ${(build - buy).toLocaleString()}`; };
  fields.forEach(field => field.addEventListener("input", update)); update(); slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

建议由四项输入在本地计算，监听器清理遵循隔离模块生命周期。
