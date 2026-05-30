---
title: 物理量公式面板
category: 物理与化学
status: published
order: 51
summary: 在牛顿第二定律、动能和重力势能之间切换，拖动参数实时计算，用 KaTeX 展示公式。
tags: physics, mechanics, formula, newton
components: card, select, input, slider, formula, stat, callout, grid, column
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 物理量公式面板

同一个 slider，切换公式后标签和含义跟着变——Select + 条件分支的威力。

| 公式 | 变量 | 单位 |
|------|------|------|
| $F = ma$ | F, m, a | N, kg, m/s² |
| $E_k = \frac{1}{2}mv^2$ | Ek, m, v | J, kg, m/s |
| $E_p = mgh$ | Ep, m, g, h | J, kg, m/s², m |

```slex
{
  slex: "0.1",
  namespace: "example_physics_formula_panel",
  g: {
    formula: "newton", mass: 10, acceleration: 9.8, velocity: 10, height: 20, gravity: 9.8,
    result: function () { if (this.formula === "newton") return this.mass * this.acceleration; if (this.formula === "kinetic") return 0.5 * this.mass * this.velocity * this.velocity; return this.mass * this.gravity * this.height; },
    unit: function () { return this.formula === "newton" ? "N" : "J"; },
    formulaTex: function () {
      if (this.formula === "newton") return 'F = ' + this.mass + ' \\times ' + this.acceleration + ' = ' + this.result().toFixed(1) + '\\text{ N}';
      if (this.formula === "kinetic") return 'E_k = \\frac{1}{2} \\times ' + this.mass + ' \\times ' + this.velocity + '^2 = ' + this.result().toFixed(1) + '\\text{ J}';
      return 'E_p = ' + this.mass + ' \\times ' + this.gravity + ' \\times ' + this.height + ' = ' + this.result().toFixed(1) + '\\text{ J}';
    },
    label1: function () { return this.formula === "newton" ? "加速度 a" : this.formula === "kinetic" ? "速度 v" : "高度 h"; },
    unit1: function () { return this.formula === "newton" ? "m/s²" : this.formula === "kinetic" ? "m/s" : "m"; },
    paramValue: function () { return this.formula === "newton" ? this.acceleration : this.formula === "kinetic" ? this.velocity : this.height; },
    setParam: "g.formula === 'newton' ? g.acceleration = Number($event) : g.formula === 'kinetic' ? g.velocity = Number($event) : g.height = Number($event)"
  },
  layout: {
    "card:physics": {
      title: "力学公式面板",
      "select:formula": { label: "选择公式", "$value": "g.formula", options: [{ label: "牛顿第二定律 F=ma", value: "newton" }, { label: "动能 E=½mv²", value: "kinetic" }, { label: "重力势能 Ep=mgh", value: "potential" }], onchange: "g.formula = String($event)" },
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:massField": { "input:mass": { label: "质量 m", "$value": "g.mass", type: "number", unit: "kg", onchange: "g.mass = Number($event || 0)" }, "slider:mass": { label: "m", "$value": "g.mass", min: 0.1, max: 100, step: 0.1, unit: "kg", onchange: "g.mass = Number($event)" } },
        "column:paramField": { "input:param": { "$label": "g.label1()", "$value": "g.paramValue()", type: "number", "$unit": "g.unit1()", "onchange": "g.setParam" }, "slider:param": { "$label": "g.label1()", "$value": "g.paramValue()", min: 0.1, max: 100, step: 0.1, "$unit": "g.unit1()", "onchange": "g.setParam" } }
      },
      "formula:result": { "$tex": "g.formulaTex()" },
      "stat:result": { label: "计算结果", "$value": "g.result().toFixed(2)", "$unit": "g.unit()" },
      "callout:note": { tone: "info", "$text": "g.formula === 'newton' ? 'g = 9.8 m/s² 标准值。' : g.formula === 'kinetic' ? '动能与速度平方成正比——速度翻倍，动能翻四倍。' : 'g = 9.8 m/s²。高度以地面为参考零点。'" }
    }
  }
}
```

Fallback：牛顿定律 10kg × 9.8 = 98 N；动能 10kg × 10²/2 = 500 J；势能 10 × 9.8 × 20 = 1960 J。

- 同一个 slider 在不同公式下含义和单位不同——这是 SlexKit 条件分支的典型应用
- 一个面板覆盖 3 个公式，不是写 3 个计算器
