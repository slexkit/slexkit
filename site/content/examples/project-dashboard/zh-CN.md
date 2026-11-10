---
title: "项目仪表盘"
category: "仪表盘"
status: published
order: 11
summary: "用 section + grid 搭建信息仪表盘，覆盖 Sprint 进度、质量指标和团队健康度的多卡片联动。"
tags: dashboard, sprint, metrics, team
components: card, grid, input, slider, stat
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 项目仪表盘

该仪表盘组合卡片、网格、控件与指标，并由一个 JavaScript 更新函数统一协调项目数据。

```slex
<slex-card title="项目仪表盘"><slex-grid columns="2"><slex-input id="left" label="数值 A" value="10"></slex-input><slex-slider id="right" label="数值 B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="结果"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

数据保存在组件 property 与普通 JavaScript 中，不依赖隐藏 namespace store 或表达式求值器。
