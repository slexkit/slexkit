---
title: 单位换算实验台
category: 科学与教育
status: published
order: 61
summary: 在长度、质量和温度类别间快速换算，支持动态单位选项切换。
tags: unit, conversion, lab
components: card, input, select, slider, stat, grid
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 单位换算实验台

长度、质量、温度——三类单位覆盖绝大多数工程和日常场景。select 选类别后，源/目标单位选项自动更新（动态 options）。

```slex
{
  slex: "0.1",
  namespace: "example_unit_conversion_lab",
  g: {
    category: "length", value: 1, fromUnit: "m", toUnit: "cm",
    conversions: {
      "length": { "mm": 0.001, "cm": 0.01, "m": 1, "km": 1000, "in": 0.0254, "ft": 0.3048, "yd": 0.9144, "mi": 1609.344 },
      "mass": { "mg": 0.000001, "g": 0.001, "kg": 1, "t": 1000, "oz": 0.0283495, "lb": 0.453592 },
      "temperature": { "c": 1, "f": 1, "k": 1 }
    },
    units: function () { return Object.keys(this.conversions[this.category] || {}); },
    unitOptions: function () { return this.units().map(function(u) { return { label: u, value: u }; }); },
    converted: function () {
      var v = this.value, from = this.fromUnit, to = this.toUnit;
      if (this.category === "temperature") {
        var c = from === "c" ? v : from === "f" ? (v - 32) * 5/9 : v - 273.15;
        return to === "c" ? c : to === "f" ? c * 9/5 + 32 : c + 273.15;
      }
      return v * this.conversions[this.category][from] / this.conversions[this.category][to];
    }
  },
  layout: {
    "card:unit": {
      title: "单位换算",
      "select:category": { label: "类别", "$value": "g.category", options: [{ label: "长度", value: "length" }, { label: "质量", value: "mass" }, { label: "温度", value: "temperature" }], onchange: "g.category = String($event); g.fromUnit = g.units()[0]; g.toUnit = g.units()[0]" },
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:valField": { "input:value": { label: "数值", "$value": "g.value", type: "number", onchange: "g.value = Number($event || 0)" }, "slider:value": { label: "数值", "$value": "g.value", min: 0.01, max: 1000, step: 0.01, onchange: "g.value = Number($event)" } },
        "column:unitField": { "select:fromUnit": { label: "源单位", "$value": "g.fromUnit", options: "g.unitOptions()", onchange: "g.fromUnit = String($event)" }, "select:toUnit": { label: "目标单位", "$value": "g.toUnit", options: "g.unitOptions()", onchange: "g.toUnit = String($event)" } }
      },
      "stat:result": { label: "结果", "$value": "g.converted().toFixed(6).replace(/\\.?0+$/, '')" }
    }
  }
}
```

Fallback：1 m → 100 cm。

切换长度/质量/温度类别后，源单位和目标单位的选项会自动更新。
