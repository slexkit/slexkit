---
title: 线性插值工具
category: 科学与教育
status: published
order: 62
summary: 在两个已知标定点之间做线性插值，适合传感器校准和查找表估算。
tags: math, interpolation, sensor, calibration
components: card, input, formula, stat, checkbox, callout, grid
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 线性插值工具

$$y = y_1 + (x - x_1) \times k \quad\quad k = \frac{y_2 - y_1}{x_2 - x_1}$$

一个温度传感器：20°C → 1.2V, 40°C → 2.0V。问 30°C 时电压？

```slex
{
  slex: "0.1",
  namespace: "example_linear_interpolation_tool",
  g: {
    x: 30, x1: 20, y1: 1.2, x2: 40, y2: 2.0, checked: false,
    k: function () { return (this.y2 - this.y1) / (this.x2 - this.x1); },
    result: function () { return this.y1 + (this.x - this.x1) * this.k(); }
  },
  layout: {
    "card:interp": {
      title: "线性插值 — 传感器校准",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:inputField": { "input:x": { label: "目标温度 x", "$value": "g.x", type: "number", unit: "°C", onchange: "g.x = Number($event || 0)" }, "stat:result": { label: "估算电压", "$value": "g.result().toFixed(3)", unit: "V" } },
        "column:checkField": { "formula:eq": { "$tex": "'y = ' + g.y1 + ' + (' + g.x + ' - ' + g.x1 + ') \\\\times \\\\frac{' + g.y2 + ' - ' + g.y1 + '}{' + g.x2 + ' - ' + g.x1 + '} = ' + g.result().toFixed(3) + '\\\\text{ V}'" }, "checkbox:checked": { label: "确认端点准确且在两端之间", "$checked": "g.checked", onchange: "g.checked = Boolean($event)" }, "callout:note": { "$tone": "g.checked ? 'success' : 'info'", "$text": "g.checked ? '插值结果可信。' : '确认端点值准确，目标在两端之间。'" } }
      }
    }
  }
}
```

Fallback：30°C → 1.6V。

- **内插 vs 外推**：内插才可靠，外推假设线性在区间外也成立
- 怀疑非线性？用三点的分段线性插值或多项式拟合
