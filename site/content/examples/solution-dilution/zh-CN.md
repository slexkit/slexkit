---
title: 溶液稀释计算器
category: 物理与化学
status: published
order: 54
summary: 利用 C₁V₁ = C₂V₂ 稀释公式，输入母液浓度和体积、目标浓度，计算所需溶剂体积。
tags: chemistry, dilution, solution, concentration
components: card, input, formula, stat, callout, badge, grid
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 溶液稀释计算器

$$C_1 V_1 = C_2 V_2$$

实验室配试剂最常用的公式——物质总量不变。

```slex
{
  slex: "0.1",
  namespace: "example_solution_dilution",
  g: {
    c1: 2, v1: 50, c2: 0.1, concUnit: "mol/L",
    v2: function () { return this.c2 > 0 ? this.c1 * this.v1 / this.c2 : Infinity; },
    diluent: function () { return this.v2() - this.v1; },
    factor: function () { return this.c2 > 0 ? (this.c1 / this.c2).toFixed(0) : Infinity; },
    isFeasible: function () { return this.c1 > this.c2 && this.v1 < this.v2(); }
  },
  layout: {
    "card:dilution": {
      title: "溶液稀释",
      "grid:params": {
        columns: 1, mdColumns: 3,
        "input:c1": { label: "母液浓度 C₁", "$value": "g.c1", type: "number", onchange: "g.c1 = Number($event || 0)" },
        "input:v1": { label: "母液用量 V₁", "$value": "g.v1", type: "number", unit: "mL", onchange: "g.v1 = Number($event || 0)" },
        "input:c2": { label: "目标浓度 C₂", "$value": "g.c2", type: "number", onchange: "g.c2 = Number($event || 0)" }
      },
      "formula:equation": { "$tex": "g.c2 > 0 ? 'V_2 = \\\\frac{C_1 V_1}{C_2} = \\\\frac{' + g.c1 + ' \\\\times ' + g.v1 + '}{' + g.c2 + '} = ' + g.v2().toFixed(1) + '\\\\text{ mL}' : 'C_2 不能为 0'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:v2": { label: "目标体积 V₂", "$value": "Number.isFinite(g.v2()) ? g.v2().toFixed(1) : '∞'", unit: "mL" },
        "stat:diluent": { label: "添加溶剂", "$value": "Number.isFinite(g.diluent()) ? g.diluent().toFixed(1) : '∞'", unit: "mL" },
        "stat:factor": { label: "稀释倍数", "$value": "Number.isFinite(g.factor()) ? g.factor() + 'x' : '∞'" }
      },
      "badge:feasible": { "$label": "g.isFeasible() ? '操作可行' : '参数不合理'", "$tone": "g.isFeasible() ? 'success' : 'danger'" },
      "callout:procedure": { "$text": "g.c1 > g.c2 ? '步骤：① 取 ' + g.v1 + ' mL 母液入容量瓶；② 加溶剂定容至 ' + g.v2().toFixed(1) + ' mL；③ 摇匀。稀释 ' + g.factor() + 'x。' : 'C₁ 必须 > C₂，否则需浓缩而非稀释。'" }
    }
  }
}
```

Fallback：2 mol/L × 50 mL / 0.1 mol/L → 1000 mL，加 950 mL 溶剂。

- 容量瓶定容精度可达 0.1%
- 串行稀释：极高倍数时分步稀释
- 弱酸/弱碱不能直接用此公式——有电离平衡
