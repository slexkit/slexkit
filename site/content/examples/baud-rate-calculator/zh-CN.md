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

输入外设时钟、目标波特率与整数分频值；模块脚本按 16 倍过采样计算实际波特率和误差。

```slex
<slex-card title="波特率误差计算器"><slex-grid columns="3"><slex-input id="clock" type="number" label="外设时钟" unit="MHz" value="48" min="0"></slex-input><slex-input id="divider" type="number" label="分频值" value="26" min="1" step="1"></slex-input><slex-input id="target" type="number" label="目标波特率" value="115200" min="1"></slex-input></slex-grid><slex-stat id="result" label="实际波特率 / 误差"></slex-stat></slex-card>
<script type="module">
  const fields = ["clock", "divider", "target"].map(id => slex.root.querySelector(`#${id}`));
  const result = slex.root.querySelector("#result");
  const update = () => {
    const [clock, divider, target] = fields.map(field => Number(field.value));
    if (!(clock > 0 && target > 0 && Number.isInteger(divider) && divider > 0)) { result.value = "请输入有效参数"; return; }
    const baud = clock * 1e6 / (16 * divider);
    result.value = `${baud.toFixed(0)} / ${((baud / target - 1) * 100).toFixed(2)}%`;
  };
  fields.forEach(field => field.addEventListener("input", update)); update();
  slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

计算逻辑从控件的实时 property 读取输入，并在同一个指标中显示实际波特率和百分比误差。
