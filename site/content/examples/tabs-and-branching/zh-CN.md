---
title: "分支与切换：模式选择器"
category: "入门教程"
status: published
order: 4
summary: "用 select 切换 mode 状态，并根据当前模式渲染不同输入和结果。"
tags: select, branching, conditional
components: section, select, input, slider, stat, callout, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 分支与切换：模式选择器

`select` 切换 `mode` 状态；当前模式决定要渲染的输入和结果。

模式切换遵循 `UI = f(state)`：更新 `mode` 后，视图区域随状态切换。

```slex
{
  slex: "0.1",
  namespace: "learn_tabs_branching",
  g: {
    mode: "length",
    value: 100,
    convert: function () {
      if (this.mode === "length") return (this.value / 100).toFixed(2) + " m";
      if (this.mode === "weight") return (this.value * 2.20462).toFixed(2) + " 磅 (lbs)";
      if (this.mode === "temp") return (this.value * 9 / 5 + 32).toFixed(1) + " °F";
      return "—";
    },
    label: function () {
      if (this.mode === "length") return "厘米转米";
      if (this.mode === "weight") return "公斤转磅";
      return "摄氏度转华氏度";
    }
  },
  layout: {
    "section:branching": {
      eyebrow: "入门教程 · 4/4",
      title: "分支与切换：模式选择器",
      subtitle: "切换下面的模式，输入的参数和计算结果会跟着变化。一种模式 = 一种 UI 状态。",
      "select:mode": {
        label: "转换模式",
        "$value": "g.mode",
        options: [
          { label: "长度 (cm → m)", value: "length" },
          { label: "重量 (kg → lbs)", value: "weight" },
          { label: "温度 (°C → °F)", value: "temp" }
        ],
        onchange: "g.mode = String($event)"
      },
      "input:value": { label: "输入值", "$value": "g.value", type: "number", onchange: "g.value = Number($event || 0)" },
      "stat:result": { "$label": "g.label()", "$value": "g.convert()" },
      "callout:guide": {
        "$tone": "g.mode === 'temp' ? 'warning' : 'info'",
        "$text": "g.mode === 'length' ? '1 米 = 100 厘米，除以 100 即可。' : g.mode === 'weight' ? '1 公斤 ≈ 2.20462 磅。' : '°F = °C × 9/5 + 32。华氏度范围更大，注意精度。'"
      }
    }
  }
}
```
