---
title: BMI 计算器
category: 科学与教育
status: published
order: 63
summary: 通过身高和体重实时计算 BMI 并显示体重分类。
tags: health, bmi, calculator
components: card, input, slider, formula, stat, badge, grid, column
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# BMI 计算器

$$BMI = \frac{\text{体重}(kg)}{\text{身高}^2(m^2)}$$

| < 18.5 | 偏瘦 | 18.5–24.9 | 正常 | 25–27.9 | 超重 | ≥ 28 | 肥胖 |

```slex
{
  slex: "0.1",
  namespace: "example_bmi_calculator",
  g: {
    height: 175, weight: 70,
    bmi: function () { return this.weight / Math.pow(this.height / 100, 2); },
    category: function () { var v = this.bmi(); if (v < 18.5) return "偏瘦"; if (v < 25) return "正常"; if (v < 28) return "超重"; return "肥胖"; },
    tone: function () { var v = this.bmi(); if (v < 18.5) return "warning"; if (v < 25) return "success"; if (v < 28) return "warning"; return "danger"; }
  },
  layout: {
    "card:bmi": {
      title: "BMI 计算器",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:heightField": { "input:height": { label: "身高", "$value": "g.height", type: "number", unit: "cm", onchange: "g.height = Number($event || 0)" }, "slider:height": { label: "身高", "$value": "g.height", min: 140, max: 210, step: 1, unit: "cm", onchange: "g.height = Number($event)" } },
        "column:weightField": { "input:weight": { label: "体重", "$value": "g.weight", type: "number", unit: "kg", onchange: "g.weight = Number($event || 0)" }, "slider:weight": { label: "体重", "$value": "g.weight", min: 40, max: 150, step: 1, unit: "kg", onchange: "g.weight = Number($event)" } }
      },
      "formula:bmi_eq": { "$tex": "'BMI = \\\\frac{' + g.weight + '}{' + (g.height/100).toFixed(2) + '^2} = ' + g.bmi().toFixed(1) + '\\\\text{ kg/m}^2'" },
      "stat:bmi": { label: "BMI", "$value": "g.bmi().toFixed(1)" },
      "badge:category": { "$label": "g.category()", "$tone": "g.tone()" }
    }
  }
}
```

Fallback：175cm, 70kg → BMI ≈ 22.9，正常。

BMI 适用于大规模筛查，不区分体脂与肌肉。运动员、孕妇、儿童和老年人应结合更多指标。
