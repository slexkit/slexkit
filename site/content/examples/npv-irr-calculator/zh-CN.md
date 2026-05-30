---
title: NPV/IRR 投资分析
category: 金融财务
status: published
order: 43
summary: 输入初始投资和 5 年现金流，用折现率计算净现值（NPV），判断项目是否创造价值。
tags: finance, npv, irr, investment, dcf
components: card, input, slider, formula, stat, callout, badge, grid, column
difficulty: 高级
runtime: trusted
featured: false
slexkitRenderMode: component
---

# NPV/IRR 投资分析

ROI 不考虑"钱的时间价值"。NPV 把未来现金流折现到今天——NPV > 0 才创造价值。

## 核心公式

$$NPV = -I_0 + \sum_{t=1}^{5} \frac{CF_t}{(1 + r)^t}$$

```slex
{
  slex: "0.1",
  namespace: "example_npv_irr_calculator",
  g: {
    initialInvestment: 100000, cashFlow1: 30000, cashFlow2: 40000, cashFlow3: 50000, cashFlow4: 40000, cashFlow5: 30000, discountRate: 10,
    cashFlows: function () { return [0, this.cashFlow1, this.cashFlow2, this.cashFlow3, this.cashFlow4, this.cashFlow5]; },
    npv: function () { var r = this.discountRate / 100; var sum = -this.initialInvestment; for (var i = 1; i <= 5; i++) { sum += this.cashFlows()[i] / Math.pow(1 + r, i); } return Math.round(sum); },
    totalCashFlow: function () { var s = 0; for (var i = 1; i <= 5; i++) s += this.cashFlows()[i]; return s; },
    pi: function () { return this.initialInvestment > 0 ? ((this.npv() + this.initialInvestment) / this.initialInvestment).toFixed(2) : 0; },
    isGood: function () { return this.npv() > 0; }
  },
  layout: {
    "card:npv": {
      title: "NPV 投资分析",
      "grid:params": {
        columns: 1, mdColumns: 3,
        "input:initialInvestment": { label: "初始投资 I₀", "$value": "g.initialInvestment", type: "number", unit: "元", onchange: "g.initialInvestment = Number($event || 0)" },
        "input:cashFlow1": { label: "第 1 年 CF", "$value": "g.cashFlow1", type: "number", unit: "元", onchange: "g.cashFlow1 = Number($event || 0)" },
        "input:cashFlow2": { label: "第 2 年 CF", "$value": "g.cashFlow2", type: "number", unit: "元", onchange: "g.cashFlow2 = Number($event || 0)" },
        "input:cashFlow3": { label: "第 3 年 CF", "$value": "g.cashFlow3", type: "number", unit: "元", onchange: "g.cashFlow3 = Number($event || 0)" },
        "input:cashFlow4": { label: "第 4 年 CF", "$value": "g.cashFlow4", type: "number", unit: "元", onchange: "g.cashFlow4 = Number($event || 0)" },
        "input:cashFlow5": { label: "第 5 年 CF", "$value": "g.cashFlow5", type: "number", unit: "元", onchange: "g.cashFlow5 = Number($event || 0)" }
      },
      "column:rField": { "input:discountRate": { label: "折现率 r", "$value": "g.discountRate", type: "number", unit: "%", onchange: "g.discountRate = Number($event || 0)" }, "slider:discountRate": { label: "r", "$value": "g.discountRate", min: 1, max: 30, step: 0.5, unit: "%", onchange: "g.discountRate = Number($event)" } },
      "formula:eq": { "$tex": "'NPV = -' + g.initialInvestment.toLocaleString() + ' + \\\\sum_{t=1}^{5} \\\\frac{CF_t}{(1+' + (g.discountRate/100).toFixed(2) + ')^t}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:npv": { label: "NPV 净现值", "$value": "g.npv().toLocaleString()", unit: "元" },
        "stat:totalCF": { label: "未折现现金流", "$value": "g.totalCashFlow().toLocaleString()", unit: "元" },
        "stat:pi": { label: "盈利指数 PI", "$value": "g.pi()" }
      },
      "badge:status": { "$label": "g.isGood() ? '值得投资' : '不值得投资'", "$tone": "g.isGood() ? 'success' : 'danger'" },
      "callout:advice": { "$tone": "g.isGood() ? 'success' : 'danger'", "$text": "g.isGood() ? 'NPV ' + g.npv().toLocaleString() + ' > 0，项目创造价值。' : 'NPV ' + g.npv().toLocaleString() + ' < 0，不值得投资。'" }
    }
  }
}
```

Fallback：投资 10 万, 5 年 [30k,40k,50k,40k,30k], r=10% → NPV ≈ 42,539, PI ≈ 1.43。

- 折现率：用 WACC 或保守 10-15%
- NPV vs IRR：NPV 绝对值优先于百分比
- 拖折现率滑块看 NPV 从正变负的临界点
