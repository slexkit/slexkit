---
title: 贝叶斯概率更新
category: 数据科学
status: published
order: 33
summary: 输入先验概率和检测准确率，用贝叶斯定理计算后验概率，展示新信息如何改变信念。
tags: statistics, bayesian, probability
components: card, input, slider, formula, stat, callout, badge, grid, column
difficulty: 高级
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 贝叶斯概率更新

"测试阳性 ≠ 患病"——贝叶斯定理最反直觉的应用。先验概率（基础发病率）和检测准确率共同决定阳性结果的可信度。

## 核心公式

$$P(H|E) = \frac{P(E|H) \times P(H)}{P(E|H) \times P(H) + P(E|\neg H) \times (1-P(H))}$$

```slex
{
  slex: "0.1",
  namespace: "example_bayesian_updater",
  g: {
    prior: 1, sensitivity: 95, specificity: 95,
    priorPct: function () { return this.prior / 100; },
    falsePositiveRate: function () { return 1 - this.specificity / 100; },
    numerator: function () { return this.sensitivity / 100 * this.priorPct(); },
    denominator: function () { return this.sensitivity / 100 * this.priorPct() + this.falsePositiveRate() * (1 - this.priorPct()); },
    posterior: function () { return this.denominator() > 0 ? (this.numerator() / this.denominator() * 100).toFixed(2) : 0; },
    posteriorValue: function () { return Number(this.posterior()); },
    verdict: function () { var p = this.posteriorValue(); return p > 50 ? "大概率真阳性" : p > 10 ? "需进一步检查" : "优先考虑假阳性"; },
    tone: function () { var p = this.posteriorValue(); return p > 50 ? "success" : p > 10 ? "warning" : "danger"; }
  },
  layout: {
    "card:bayes": {
      title: "贝叶斯更新",
      "grid:params": {
        columns: 1, mdColumns: 3,
        "column:priorField": { "input:prior": { label: "先验 %", "$value": "g.prior", type: "number", unit: "%", onchange: "g.prior = Number($event || 0)" }, "slider:prior": { label: "先验", "$value": "g.prior", min: 0.01, max: 50, step: 0.01, unit: "%", onchange: "g.prior = Number($event)" } },
        "column:sensField": { "input:sensitivity": { label: "灵敏度 %", "$value": "g.sensitivity", type: "number", unit: "%", onchange: "g.sensitivity = Number($event || 0)" }, "slider:sensitivity": { label: "灵敏度", "$value": "g.sensitivity", min: 50, max: 99.99, step: 0.5, unit: "%", onchange: "g.sensitivity = Number($event)" } },
        "column:specField": { "input:specificity": { label: "特异性 %", "$value": "g.specificity", type: "number", unit: "%", onchange: "g.specificity = Number($event || 0)" }, "slider:specificity": { label: "特异性", "$value": "g.specificity", min: 50, max: 99.99, step: 0.5, unit: "%", onchange: "g.specificity = Number($event)" } }
      },
      "formula:eq": { "$tex": "'P(H|+) = \\\\frac{' + g.sensitivity/100 + ' \\\\times ' + (g.prior/100).toFixed(4) + '}{' + g.sensitivity/100 + ' \\\\times ' + (g.prior/100).toFixed(4) + ' + ' + g.falsePositiveRate().toFixed(2) + ' \\\\times ' + (1-g.prior/100).toFixed(4) + '}'" },
      "stat:posterior": { label: "后验 P(H|+)", "$value": "g.posterior()", unit: "%" },
      "badge:verdict": { "$label": "g.verdict()", "$tone": "g.tone()" },
      "callout:explain": { "$tone": "g.tone()", "$text": "g.posteriorValue() > 50 ? '后验 > 50%，真阳性可能性大。' : g.posteriorValue() > 10 ? '后验不高。即使测试准确率很好，当先验低时大量假阳性会淹没真阳性。' : '后验很低！高特异性测试（如 99.9%）才能在此情况下有效。'" }
    }
  }
}
```

Fallback：先验 1%, 灵敏度 95%, 特异性 95% → 后验仅 16.1%。

- 先验 1% → 10%，后验从 16% → 68%（先验是关键）
- 垃圾邮件过滤、异常检测都是贝叶斯的应用
- 罕见事件（<1%）即使测试准确率 99%，阳性预测值也极低
