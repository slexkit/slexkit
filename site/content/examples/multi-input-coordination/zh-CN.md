---
title: "多输入协同"
category: "入门教程"
status: published
order: 3
summary: "输入框与滑块通过原生 input 事件共同驱动一个 JavaScript 计算函数。"
tags: reactive, coordinated, formula
components: card, grid, input, slider, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 多输入协同

两个实时控件共用一个普通 JavaScript 更新函数，再通过组件 property 回写计算结果。

```slex
<slex-card title="多输入协同"><slex-grid columns="2"><slex-input id="left" label="数值 A" value="10"></slex-input><slex-slider id="right" label="数值 B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="结果"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

两个监听器位于同一清理作用域，不涉及表达式求值器或隐式绑定图。
