---
title: "多输入协同：两个滑块联动"
category: "入门教程"
status: published
order: 3
summary: "两个 slider 相互影响，引入 g 方法、formula 组件和条件渲染。"
tags: reactive, coordinated, formula
components: section, slider, input, stat, formula, badge, callout, grid, column
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 多输入协同：两个滑块联动

真实场景中往往有多个输入变量，它们相互影响。这需要引入两样新东西：
1. **`g.method()`** — 依赖其他状态的计算值（类似 Vue computed）
2. **`$if`** — 条件渲染（根据状态决定显示或隐藏组件）

```slex
{
  slex: "0.1",
  namespace: "learn_multi_coordination",
  g: {
    width: 120,
    height: 80,
    area: function () { return this.width * this.height; },
    isLandscape: function () { return this.width > this.height; },
    ratio: function () { return (this.width / this.height).toFixed(2); }
  },
  layout: {
    "section:coordinated": {
      eyebrow: "入门教程 · 3/4",
      title: "多输入协同：矩形尺寸联动",
      subtitle: "同时调整宽和高，面积和宽高比自动重新计算。这就是 g 方法的力量。",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:w": {
          "input:widthInput": { label: "宽度", "$value": "g.width", type: "number", unit: "px", onchange: "g.width = Number($event || 0)" },
          "slider:widthSlider": { label: "宽度", "$value": "g.width", min: 20, max: 300, step: 5, unit: "px", onchange: "g.width = Number($event)" }
        },
        "column:h": {
          "input:heightInput": { label: "高度", "$value": "g.height", type: "number", unit: "px", onchange: "g.height = Number($event || 0)" },
          "slider:heightSlider": { label: "高度", "$value": "g.height", min: 20, max: 300, step: 5, unit: "px", onchange: "g.height = Number($event)" }
        }
      },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:area": { label: "面积", "$value": "g.area()", unit: "px²" },
        "stat:ratio": { label: "宽高比", "$value": "g.ratio()" },
        "badge:orientation": {
          "$label": "g.isLandscape() ? '横向' : g.width === g.height ? '正方形' : '纵向'",
          "$tone": "g.isLandscape() ? 'info' : g.width === g.height ? 'success' : 'warning'"
        }
      },
      "formula:areaEq": { "$tex": "'\\\\text{面积} = ' + g.width + ' \\\\times ' + g.height + ' = ' + g.area() + '\\\\text{ px}^2'" },
      "callout:tip": {
        "$tone": "g.isLandscape() ? 'info' : 'warning'",
        "$text": "g.isLandscape() ? '当前为横向（Landscape）。横向更适用于宽屏展示。' : '当前为纵向（Portrait）。纵向更适用于移动端阅读。'"
      },
      "callout:squareTip": {
        "$if": "g.width === g.height",
        tone: "success",
        text: "这是一个正方形！宽高完全相等。"
      }
    }
  }
}
```

**三个新知识点：**

| 概念 | 写法 | 含义 |
|:---|:---|:---|
| g 方法 | `area: function() { return this.width * this.height; }` | `this` 指向 g 对象本身，返回动态计算值 |
| 动态公式 | `"$tex": "'...' + g.width + '...'"` | formula 组件可根据 g 值实时渲染 KaTeX |
| 条件渲染 | `"$if": "g.width === g.height"` | 只有表达式返回 true 时该组件才渲染 |
