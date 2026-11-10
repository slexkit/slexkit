---
title: "分支与切换：模式选择器"
category: "入门教程"
status: published
order: 4
summary: "用 select 切换 mode 状态，并根据当前模式渲染不同输入和结果。"
tags: select, branching, conditional
components: card, select, input, stat, text
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 分支与切换：模式选择器

选择长度、重量或温度转换；输入值与结果随模式更新。

```slex
<slex-card title="单位转换">
  <slex-select id="mode" label="转换模式"><option value="length">厘米 → 米</option><option value="weight">公斤 → 磅</option><option value="temperature">摄氏度 → 华氏度</option></slex-select>
  <slex-input id="amount" type="number" label="数值（厘米）" value="100"></slex-input>
  <slex-stat id="result" label="转换结果"></slex-stat>
  <slex-text id="description"></slex-text>
</slex-card>
<script type="module">
  const mode = slex.root.querySelector("#mode");
  const amount = slex.root.querySelector("#amount");
  const result = slex.root.querySelector("#result");
  const description = slex.root.querySelector("#description");
  const modes = {
    length: { label: "数值（厘米）", description: "厘米除以 100 得到米。", convert: n => `${(n / 100).toFixed(2)} m` },
    weight: { label: "数值（公斤）", description: "公斤乘以 2.20462 得到磅。", convert: n => `${(n * 2.20462).toFixed(2)} lb` },
    temperature: { label: "数值（摄氏度）", description: "摄氏度乘以 9/5，再加 32。", convert: n => `${(n * 9 / 5 + 32).toFixed(1)} °F` },
  };
  const update = () => {
    const selected = modes[mode.value] || modes.length;
    const number = amount.value === "" ? NaN : Number(amount.value);
    amount.label = selected.label;
    description.text = selected.description;
    result.value = Number.isFinite(number) ? selected.convert(number) : "请输入数值";
  };
  mode.addEventListener("change", update);
  amount.addEventListener("input", update);
  update();
  slex.onDispose(() => { mode.removeEventListener("change", update); amount.removeEventListener("input", update); });
</script>
```

模式与输入值由普通 JavaScript 事件驱动，监听器会在组件卸载时释放。
