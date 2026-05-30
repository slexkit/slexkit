---
title: 复利计算器
category: 金融财务
status: published
order: 40
summary: 调整本金、年利率、年限和复利频次，精确计算复利终值、累计利息和实际年化收益率。
tags: finance, compound-interest, savings
components: card, input, slider, formula, stat, table, callout, grid, column
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 复利计算器

复利是时间价值的最直观体现：利息再生利息，曲线不是线性的——越往后越陡。

## 核心公式

$$A = P \times (1 + \frac{r}{n})^{nt}$$

$$EAR = (1 + \frac{r}{n})^n - 1$$

```slex
{
  slex: "0.1",
  namespace: "example_loan_compound_calculator",
  g: {
    principal: 100000, annualRate: 5, years: 10, compoundingsPerYear: 12,
    futureValue: function () { return this.principal * Math.pow(1 + this.annualRate / 100 / this.compoundingsPerYear, this.compoundingsPerYear * this.years); },
    totalInterest: function () { return this.futureValue() - this.principal; },
    effectiveRate: function () { return ((Math.pow(1 + this.annualRate / 100 / this.compoundingsPerYear, this.compoundingsPerYear) - 1) * 100).toFixed(2); }
  },
  layout: {
    "card:compound": {
      title: "复利计算器",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:principalField": { "input:principal": { label: "本金 P", "$value": "g.principal", type: "number", unit: "元", onchange: "g.principal = Number($event || 0)" }, "slider:principal": { label: "本金", "$value": "g.principal", min: 1000, max: 1000000, step: 1000, unit: "元", onchange: "g.principal = Number($event)" } },
        "column:rateField": { "input:annualRate": { label: "年利率 r", "$value": "g.annualRate", type: "number", unit: "%", onchange: "g.annualRate = Number($event || 0)" }, "slider:annualRate": { label: "年利率", "$value": "g.annualRate", min: 0.1, max: 20, step: 0.1, unit: "%", onchange: "g.annualRate = Number($event)" } },
        "column:yearsField": { "input:years": { label: "年限 t", "$value": "g.years", type: "number", unit: "年", onchange: "g.years = Number($event || 0)" }, "slider:years": { label: "年限", "$value": "g.years", min: 1, max: 40, step: 1, unit: "年", onchange: "g.years = Number($event)" } },
        "column:cpField": { "input:compoundingsPerYear": { label: "复利频次 n", "$value": "g.compoundingsPerYear", type: "number", unit: "次/年", onchange: "g.compoundingsPerYear = Number($event || 0)" }, "slider:compoundingsPerYear": { label: "频次", "$value": "g.compoundingsPerYear", min: 1, max: 365, step: 1, unit: "次/年", onchange: "g.compoundingsPerYear = Number($event)" } }
      },
      "formula:eq": { "$tex": "'A = ' + g.principal.toLocaleString() + ' \\\\times (1 + \\\\frac{' + g.annualRate.toFixed(1) + '\\\\%}{' + g.compoundingsPerYear + '})^{' + g.compoundingsPerYear + ' \\\\times ' + g.years + '}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:futureValue": { label: "终值 A", "$value": "Math.round(g.futureValue()).toLocaleString()", unit: "元" },
        "stat:interest": { label: "累计利息", "$value": "Math.round(g.totalInterest()).toLocaleString()", unit: "元" },
        "stat:effective": { label: "实际年化 EAR", "$value": "g.effectiveRate()", unit: "%" }
      },
      "callout:tip": { tone: "info", "$text": "'每年复利 ' + g.compoundingsPerYear + ' 次。连续复利终值 = ' + Math.round(g.principal * Math.exp(g.annualRate/100 * g.years)).toLocaleString() + ' 元。'" }
    }
  }
}
```

Fallback：10 万, 5%, 月复利, 10 年 → 终值 ~164,701 元, EAR 5.12%。

| 复利频次 | EAR (r=5%) |
|---------|-----------|
| 年 | 5.00% |
| 半年 | 5.06% |
| 季 | 5.09% |
| 月 | 5.12% |
| 日 | 5.13% |

- **72 法则**：72/r ≈ 资金翻倍年数。5% → ~14.4 年
- 频率的边际收益递减：月→日提升仅 0.01%
