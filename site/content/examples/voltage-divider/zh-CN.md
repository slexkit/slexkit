---
title: 分压器计算器
category: 计算器
status: published
order: 7
summary: 输入电压和两个电阻值，计算分压输出，并评估负载效应带来的误差。
tags: electronics, voltage-divider, resistor, circuit
components: card, input, slider, formula, stat, badge, callout, grid, column
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 分压器计算器

两个电阻串联，从中间引出电压——模拟电路中最简单的信号调理手段。做 ADC 电平转换、设定阈值电压、生成偏置电压，处处都在用。

## 核心公式

空载分压：$V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2}$

带负载 $R_L$ 时：$V_{out,loaded} = V_{in} \times \frac{R_2 \parallel R_L}{R_1 + R_2 \parallel R_L}$

**关键经验**：分压器阻抗（$R_1 \parallel R_2$）应至少 < 后级输入阻抗的 1/10。

```slex
{
  slex: "0.1",
  namespace: "example_voltage_divider",
  g: {
    vin: 5, r1: 10000, r2: 10000, rl: 100000,
    rParallel: function () { return this.r2 * this.rl / (this.r2 + this.rl); },
    vout: function () { return this.vin * this.r2 / (this.r1 + this.r2); },
    voutLoaded: function () { return this.vin * this.rParallel() / (this.r1 + this.rParallel()); },
    errorPercent: function () { return Math.abs((this.voutLoaded() - this.vout()) / this.vout() * 100); },
    impedanceRatio: function () { var zout = this.r1 * this.r2 / (this.r1 + this.r2); return this.rl / zout; },
    loadWarning: function () { return this.impedanceRatio() < 10 ? "负载效应显著，增大 RL 或减小 R1/R2" : "分压器阻抗足够低"; }
  },
  layout: {
    "section:divider": {
      title: "分压器计算器",
      subtitle: "两个电阻串联，从中间引出电压。",
      "card:divider": {
        title: "分压器计算器",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:r1Field": { "input:r1Input": { label: "R1", "$value": "std.units.si(g.r1, 'Ω', 1)", type: "engineering", unit: "Ω", placeholder: "10kΩ", onchange: "if ($event.valid && $event.number > 0) g.r1 = $event.number" }, "slider:r1Slider": { label: "R1", "$value": "g.r1", min: 100, max: 1000000, step: 100, unit: "Ω", onchange: "g.r1 = Number($event)" } },
        "column:r2Field": { "input:r2Input": { label: "R2", "$value": "std.units.si(g.r2, 'Ω', 1)", type: "engineering", unit: "Ω", placeholder: "10kΩ", onchange: "if ($event.valid && $event.number > 0) g.r2 = $event.number" }, "slider:r2Slider": { label: "R2", "$value": "g.r2", min: 100, max: 1000000, step: 100, unit: "Ω", onchange: "g.r2 = Number($event)" } }
      },
      "grid:params2": {
        columns: 1, mdColumns: 2,
        "column:vinField": { "input:vinInput": { label: "输入电压 Vin", "$value": "std.units.si(g.vin, 'V', 1)", type: "engineering", unit: "V", placeholder: "5V", onchange: "if ($event.valid && $event.number > 0) g.vin = $event.number" }, "slider:vinSlider": { label: "Vin", "$value": "g.vin", min: 0.1, max: 48, step: 0.1, unit: "V", onchange: "g.vin = Number($event)" } },
        "column:rlField": { "input:rlInput": { label: "负载电阻 RL", "$value": "std.units.si(g.rl, 'Ω', 1)", type: "engineering", unit: "Ω", placeholder: "100kΩ", onchange: "if ($event.valid && $event.number > 0) g.rl = $event.number" }, "slider:rlSlider": { label: "RL", "$value": "g.rl", min: 1000, max: 10000000, step: 1000, unit: "Ω", onchange: "g.rl = Number($event)" } }
      },
      "formula:eq1": { "$tex": "'V_{out} = ' + g.vin.toFixed(1) + ' \\\\times \\\\frac{' + (g.r2/1000).toFixed(1) + '\\\\text{k}}{' + (g.r1/1000).toFixed(1) + '\\\\text{k} + ' + (g.r2/1000).toFixed(1) + '\\\\text{k}} = ' + g.vout().toFixed(3) + '\\\\text{ V}'" },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:vout": { label: "空载 Vout", "$value": "g.vout().toFixed(3)", unit: "V" },
        "stat:voutLoaded": { label: "带载 Vout", "$value": "g.voutLoaded().toFixed(3)", unit: "V" },
        "stat:error": { label: "负载误差", "$value": "g.errorPercent().toFixed(2)", unit: "%" },
        "badge:ratio": { "$label": "g.impedanceRatio() < 10 ? '⚠ 负载效应' : '✓ 匹配良好'", "$tone": "g.impedanceRatio() < 10 ? 'warning' : 'success'" }
      },
      "callout:warning": { "$tone": "g.impedanceRatio() < 10 ? 'warning' : 'info'", "$text": "g.loadWarning()" }
      }
    }
  }
}
```


## 工程笔记

| R1 | R2 | Vout/Vin | 阻抗 |
|----|----|---------|------|
| 10k | 10k | 0.50 | 5k |
| 10k | 3.3k | 0.25 | 2.5k |
| 10k | 1k | 0.09 | 909 |
| 33k | 10k | 0.23 | 7.7k |

- **ADC 应用**：分压器阻抗应 < ADC 输入阻抗的 1/10，必要时加缓冲运放
- **高精度场景**：用 1% 精度电阻，R1 和 R2 用同一批次减少温漂差异
- **功率限制**：$P = V^2/R$，小阻值分压器注意发热
