---
title: KaTeX 计算实验台
category: 物理与化学
status: published
order: 50
summary: 拖动参数时 KaTeX 公式数字实时变化，展示热力学热容计算。
tags: physics, thermodynamics, katex, math
components: card, input, slider, formula, stat, progress, callout, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# KaTeX 计算实验台

`formula` 组件根据 `g` 状态动态生成 KaTeX——拖动滑块，公式里的数字跟着变。

## 热力学背景

$$Q = mc\Delta T \quad\quad P = \frac{Q}{t}$$

比热容 $c = 4186 \text{ J/(kg·°C)}$（常压水）。

```slex
{
  slex: "0.1",
  namespace: "example_katex_computation_lab",
  g: {
    mass: 0.5, heat: 4186, delta: 35, seconds: 180,
    energy: function () { return this.mass * this.heat * this.delta; },
    power: function () { return this.energy() / this.seconds; },
    household: function () { return Math.min(100, this.power() / 1200 * 100); }
  },
  layout: {
    "card:lab": {
      title: "水加热功率估算",
      "grid:params": {
        columns: 1, mdColumns: 3,
        "column:massField": { "input:mass": { label: "水的质量 m", "$value": "g.mass", type: "number", unit: "kg", onchange: "g.mass = Number($event || 0)" }, "slider:mass": { label: "m", "$value": "g.mass", min: 0.1, max: 5, step: 0.1, unit: "kg", onchange: "g.mass = Number($event)" } },
        "column:deltaField": { "input:delta": { label: "温升 ΔT", "$value": "g.delta", type: "number", unit: "°C", onchange: "g.delta = Number($event || 0)" }, "slider:delta": { label: "ΔT", "$value": "g.delta", min: 5, max: 90, step: 5, unit: "°C", onchange: "g.delta = Number($event)" } },
        "column:timeField": { "input:seconds": { label: "加热时间 t", "$value": "g.seconds", type: "number", unit: "s", onchange: "g.seconds = Number($event || 0)" }, "slider:seconds": { label: "t", "$value": "g.seconds", min: 30, max: 600, step: 30, unit: "s", onchange: "g.seconds = Number($event)" } }
      },
      "formula:energyEquation": { "$tex": "'Q = mc\\\\Delta T = ' + g.mass.toFixed(1) + ' \\\\times ' + g.heat + ' \\\\times ' + g.delta + ' = ' + Math.round(g.energy()).toLocaleString() + '\\\\text{ J}'" },
      "formula:powerEquation": { "$tex": "'P = \\\\frac{Q}{t} = \\\\frac{' + Math.round(g.energy()).toLocaleString() + '}{' + g.seconds + '} = ' + Math.round(g.power()) + '\\\\text{ W}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:energy": { label: "热量 Q", "$value": "Math.round(g.energy()).toLocaleString()", unit: "J" },
        "stat:power": { label: "平均功率 P", "$value": "Math.round(g.power())", unit: "W" },
        "progress:household": { label: "相对 1200W 电器", "$value": "g.household()" }
      },
      "callout:note": { tone: "info", text: "c = 4186 J/(kg·°C) 为常压水。实际比热容随温度变化约 0.1%/°C。" }
    }
  }
}
```

Fallback：0.5kg 水升温 35°C → Q ≈ 73,255 J, 180 秒 → P ≈ 407 W。

比热容 $c = 4186 \text{ J/(kg·°C)}$（常压水），随温度变化约 0.1%/°C，工程计算常忽略。
