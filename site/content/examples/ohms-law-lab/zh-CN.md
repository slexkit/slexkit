---
title: 欧姆定律实验台
category: 物理与化学
status: published
order: 52
summary: 选择求解目标（电压/电流/电阻），输入两个已知参数，自动计算第三个，并显示功率。
tags: physics, ohms-law, electricity, circuit
components: card, select, input, formula, stat, table, callout, grid
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 欧姆定律实验台

$$V = I \times R$$

电路分析的第一课。选择你要解的变量，输入另外两个——欧姆定律帮你算出第三个。

```slex
{
  slex: "0.1",
  namespace: "example_ohms_law_lab",
  g: {
    solveFor: "v", voltage: 12, current: 2, resistance: 6,
    result: function () { if (this.solveFor === "v") return this.current * this.resistance; if (this.solveFor === "i") return this.resistance > 0 ? this.voltage / this.resistance : Infinity; return this.current > 0 ? this.voltage / this.current : Infinity; },
    resultUnit: function () { return this.solveFor === "v" ? "V" : this.solveFor === "i" ? "A" : "Ω"; },
    formulaTex: function () {
      if (this.solveFor === "v") return 'V = ' + this.current + ' \\times ' + this.resistance + ' = ' + this.result().toFixed(2) + '\\text{ V}';
      if (this.solveFor === "i") return 'I = \\frac{' + this.voltage + '}{' + this.resistance + '} = ' + this.result().toFixed(2) + '\\text{ A}';
      return 'R = \\frac{' + this.voltage + '}{' + this.current + '} = ' + this.result().toFixed(2) + '\\text{ \\Omega}';
    },
    power: function () { return this.voltage * this.current; }
  },
  layout: {
    "card:ohms": {
      title: "欧姆定律实验台",
      "select:solveFor": { label: "求解目标", "$value": "g.solveFor", options: [{ label: "求电压 V", value: "v" }, { label: "求电流 I", value: "i" }, { label: "求电阻 R", value: "r" }], onchange: "g.solveFor = String($event)" },
      "grid:params": {
        columns: 1, mdColumns: 3,
        "input:voltage": { label: "电压 V", "$value": "g.voltage", type: "number", unit: "V", onchange: "g.voltage = Number($event || 0)" },
        "input:current": { label: "电流 I", "$value": "g.current", type: "number", unit: "A", onchange: "g.current = Number($event || 0)" },
        "input:resistance": { label: "电阻 R", "$value": "g.resistance", type: "number", unit: "Ω", onchange: "g.resistance = Number($event || 0)" }
      },
      "formula:equation": { "$tex": "g.formulaTex()" },
      "grid:results": {
        columns: 1, mdColumns: 2,
        "stat:result": { label: "结果", "$value": "Number.isFinite(g.result()) ? g.result().toFixed(2) : '∞'", "$unit": "g.resultUnit()" },
        "stat:power": { label: "功率 P", "$value": "Math.round(g.power())", unit: "W" }
      },
      "callout:note": { tone: "info", text: "自动计算电功率 P = VI = I²R = V²/R。" }
    }
  }
}
```

Fallback：解 V：2A × 6Ω = 12V，功率 24W。

## 4 环电阻色环速查

| 颜色 | 数值 | 倍率 | 误差 |
|------|------|------|------|
| 黑/棕/红/橙/黄 | 0/1/2/3/4 | ×1/×10/×100/×1k/×10k | - / ±1% / ±2% / - / - |
| 绿/蓝/紫 | 5/6/7 | ×100k/×1M/×10M | ±0.5%/±0.25%/±0.1% |
| 金/银 | - | ×0.1/×0.01 | ±5%/±10% |

读法：红-紫-橙-金 → 27 × 1k = 27kΩ ±5%
