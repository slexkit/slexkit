---
title: RC 低通滤波器
category: 计算器
status: published
order: 8
summary: 用电阻和电容搭建的频率选择电路，计算截止频率和任意频率下的增益衰减。
tags: electronics, circuit, filter, rc
components: card, grid, input, slider, stat
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# RC 低通滤波器

截止频率由普通 JavaScript 按 \(f_c = 1 / (2\pi RC)\) 计算，数值直接读取自定义元素的实时属性。

```slex
<slex-card title="RC 低通滤波器"><slex-grid columns="2"><slex-input id="resistance" type="number" label="电阻" unit="kΩ" value="10"></slex-input><slex-input id="capacitance" type="number" label="电容" unit="nF" value="100"></slex-input></slex-grid><slex-stat id="cutoff" label="截止频率" unit="Hz"></slex-stat></slex-card>
<script type="module">
  const r = slex.root.querySelector("#resistance"); const c = slex.root.querySelector("#capacitance"); const cutoff = slex.root.querySelector("#cutoff");
  const update = () => { cutoff.value = (1 / (2 * Math.PI * Number(r.value) * 1e3 * Number(c.value) * 1e-9)).toFixed(1); };
  r.addEventListener("input", update); c.addEventListener("input", update); update();
  slex.onDispose(() => { r.removeEventListener("input", update); c.removeEventListener("input", update); });
</script>
```

工程单位输入由控件完成解析，所得截止频率与增益再作为展示 property 写回。
