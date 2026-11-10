---
title: 分压器计算器
category: 计算器
status: published
order: 7
summary: 输入电压和两个电阻值，计算分压输出，并评估负载效应带来的误差。
tags: electronics, voltage-divider, resistor, circuit
components: card, grid, input, slider, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 分压器计算器

模块脚本用原生 `input` 事件实现 \(V_{out} = V_{in} R_2 / (R_1 + R_2)\)。

```slex
<slex-card title="分压器计算器"><slex-grid columns="3"><slex-input id="vin" type="number" label="输入电压" value="12"></slex-input><slex-input id="r1" type="number" label="R1" unit="kΩ" value="10"></slex-input><slex-input id="r2" type="number" label="R2" unit="kΩ" value="20"></slex-input></slex-grid><slex-stat id="vout" label="输出电压" unit="V"></slex-stat></slex-card>
<script type="module">
  const fields = ["vin", "r1", "r2"].map(id => slex.root.querySelector(`#${id}`)); const vout = slex.root.querySelector("#vout");
  const update = () => { const [vin, r1, r2] = fields.map(field => Number(field.value)); vout.value = fields.some(field => field.value === "") || !Number.isFinite(vin) || r1 < 0 || r2 < 0 || r1 + r2 <= 0 ? "—" : (vin * r2 / (r1 + r2)).toFixed(2); };
  fields.forEach(field => field.addEventListener("input", update)); update();
  slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

三个数值输入共同驱动计算函数并更新输出电压；无效的电阻值显示为破折号。
