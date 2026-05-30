---
title: ROI 成本收益估算
category: 金融财务
status: published
order: 41
summary: 输入初始投入、月收入、月成本和评估周期，计算 ROI、回本周期和盈亏状态。
tags: finance, roi, payback, investment
components: card, input, slider, formula, stat, callout, badge, grid, column
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# ROI 成本收益估算

启动项目前最该问的：多少钱进去、每月赚多少、每月花多少。ROI 和回本周期帮你快速判断。

## 核心公式

$$ROI = \frac{\text{总收入} - \text{总成本} - \text{初始投资}}{\text{初始投资}} \times 100\%$$

$$回本周期 = \lceil \frac{\text{初始投资}}{\text{月收入} - \text{月成本}} \rceil$$

```slex
{
  slex: "0.1",
  namespace: "example_roi_estimator",
  g: {
    investment: 50000, monthlyRevenue: 12000, monthlyCost: 3000, months: 12,
    monthlyProfit: function () { return this.monthlyRevenue - this.monthlyCost; },
    netProfit: function () { return this.monthlyProfit() * this.months - this.investment; },
    roi: function () { return (this.netProfit() / this.investment * 100).toFixed(1); },
    roiValue: function () { return Number(this.roi()); },
    paybackMonth: function () { return this.monthlyProfit() > 0 ? Math.ceil(this.investment / this.monthlyProfit()) : Infinity; },
    paybackText: function () { return Number.isFinite(this.paybackMonth()) ? this.paybackMonth() + " 个月" : "无法回本"; },
    tone: function () { var r = this.roiValue(); return r > 50 ? "success" : r > 0 ? "info" : "danger"; }
  },
  layout: {
    "card:roi": {
      title: "成本收益估算",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:investField": { "input:investment": { label: "初始投入", "$value": "g.investment", type: "number", unit: "元", onchange: "g.investment = Number($event || 0)" }, "slider:investment": { label: "初始投入", "$value": "g.investment", min: 1000, max: 500000, step: 1000, unit: "元", onchange: "g.investment = Number($event)" } },
        "column:revField": { "input:monthlyRevenue": { label: "月收入", "$value": "g.monthlyRevenue", type: "number", unit: "元", onchange: "g.monthlyRevenue = Number($event || 0)" }, "slider:monthlyRevenue": { label: "月收入", "$value": "g.monthlyRevenue", min: 0, max: 200000, step: 1000, unit: "元", onchange: "g.monthlyRevenue = Number($event)" } },
        "column:costField": { "input:monthlyCost": { label: "月成本", "$value": "g.monthlyCost", type: "number", unit: "元", onchange: "g.monthlyCost = Number($event || 0)" }, "slider:monthlyCost": { label: "月成本", "$value": "g.monthlyCost", min: 0, max: 100000, step: 500, unit: "元", onchange: "g.monthlyCost = Number($event)" } },
        "column:monthField": { "input:months": { label: "评估周期", "$value": "g.months", type: "number", unit: "个月", onchange: "g.months = Number($event || 0)" }, "slider:months": { label: "评估周期", "$value": "g.months", min: 1, max: 60, step: 1, unit: "个月", onchange: "g.months = Number($event)" } }
      },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:netProfit": { label: "净利润", "$value": "g.netProfit().toLocaleString()", unit: "元" },
        "stat:roi": { label: "ROI", "$value": "g.roi()", unit: "%" },
        "stat:payback": { label: "回本周期", "$value": "g.paybackText()" }
      },
      "badge:status": { "$label": "g.roiValue() > 0 ? '盈利' : '亏损'", "$tone": "g.tone()" },
      "callout:advice": { "$tone": "g.tone()", "$text": "g.roiValue() > 50 ? 'ROI ' + g.roi() + '%，回报可观。' : g.roiValue() > 0 ? 'ROI ' + g.roi() + '%，有正向回报。' : 'ROI 为负，考虑降成本或找新收入来源。'" }
    }
  }
}
```

Fallback：投资 5 万，月收入 1.2 万，月成本 3000 → 月利润 9000，6 个月回本。

- ROI > 0 一定做吗？不一定，要看机会成本
- 敏感性分析：拖 slider 模拟乐观/悲观场景
