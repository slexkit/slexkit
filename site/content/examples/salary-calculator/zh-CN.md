---
title: 五险一金计算器
category: 计算器
status: published
order: 5
summary: 输入工资基数和城市，计算五险一金明细，显示个人缴纳、单位缴纳和总计。
tags: salary, insurance, calculator, hr
components: card, grid, input, slider, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 五险一金计算器

调整个人缴费比例，估算个人扣款与税前剩余工资。

```slex
<slex-card title="五险一金计算器"><slex-grid columns="2"><slex-input id="salary" type="number" label="月工资" value="18000"></slex-input><slex-slider id="rate" label="个人缴费比例" unit="%" min="0" max="30" step="0.1" value="10.5"></slex-slider></slex-grid><slex-grid columns="2"><slex-stat id="deduction" label="个人扣款"></slex-stat><slex-stat id="remaining" label="税前剩余"></slex-stat></slex-grid></slex-card>
<script type="module">
  const salary = slex.root.querySelector("#salary"); const rate = slex.root.querySelector("#rate"); const deduction = slex.root.querySelector("#deduction"); const remaining = slex.root.querySelector("#remaining");
  const update = () => { const amount = Number(salary.value) * Number(rate.value) / 100; deduction.value = amount.toFixed(2); remaining.value = (Number(salary.value) - amount).toFixed(2); };
  salary.addEventListener("input", update); rate.addEventListener("input", update); update(); slex.onDispose(() => { salary.removeEventListener("input", update); rate.removeEventListener("input", update); });
</script>
```

工资与缴费比例保留为实时控件值，重新计算时只更新扣款与剩余金额。
