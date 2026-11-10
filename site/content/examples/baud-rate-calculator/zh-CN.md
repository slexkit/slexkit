---
title: 波特率误差计算器
category: 计算器
status: published
order: 9
summary: 输入晶振频率和目标波特率，计算 UART 波特率误差百分比，判断通信可靠性。
tags: electronics, uart, baud-rate, serial, crystal
components: card, grid, input, slider, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 波特率误差计算器

输入外设时钟与分频值；模块脚本计算实际波特率以及相对 115200 的误差。

```slex
<slex-card title="波特率误差计算器"><slex-grid columns="2"><slex-input id="clock" type="number" label="外设时钟" unit="MHz" value="48"></slex-input><slex-input id="divider" type="number" label="分频值" value="26"></slex-input></slex-grid><slex-stat id="result" label="实际波特率 / 误差"></slex-stat></slex-card>
<script type="module">
  const clock = slex.root.querySelector("#clock"); const divider = slex.root.querySelector("#divider"); const result = slex.root.querySelector("#result");
  const update = () => { const baud = Number(clock.value) * 1e6 / (16 * Number(divider.value)); const error = (baud / 115200 - 1) * 100; result.value = `${baud.toFixed(0)} / ${error.toFixed(2)}%`; };
  clock.addEventListener("input", update); divider.addEventListener("input", update); update(); slex.onDispose(() => { clock.removeEventListener("input", update); divider.removeEventListener("input", update); });
</script>
```

计算逻辑从控件的实时 property 读取输入，再把实际波特率与误差写回两个指标元素。
