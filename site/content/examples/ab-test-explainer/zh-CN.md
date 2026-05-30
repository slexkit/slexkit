---
title: A/B 实验结果解释
category: 数据科学
status: published
order: 30
summary: 输入两组访客和转化数据，自动计算转化率、提升幅度和 z 检验统计显著性。
tags: ab-test, statistics, experiment, z-test
components: card, input, slider, formula, stat, callout, badge, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# A/B 实验结果解释

做 A/B 测试最容易犯的错误：看到 B 组转化率高 2% 就宣布胜利。样本量不够时，2% 可能只是随机波动。

## 核心公式

$$z = \frac{p_B - p_A}{\sqrt{p(1-p)(\frac{1}{n_A} + \frac{1}{n_B})}}$$

| |z|| > 1.96 → 95% 置信显著；|z|| > 2.576 → 99% 置信显著。

```slex
{
  slex: "0.1",
  namespace: "example_ab_test_explainer",
  g: {
    visitorsA: 5000, conversionsA: 240, visitorsB: 5200, conversionsB: 312,
    rateA: function () { return (this.conversionsA / this.visitorsA * 100).toFixed(2); },
    rateB: function () { return (this.conversionsB / this.visitorsB * 100).toFixed(2); },
    lift: function () { return ((this.rateB() - this.rateA()) / this.rateA() * 100).toFixed(1); },
    zScore: function () {
      var pA = this.conversionsA / this.visitorsA, pB = this.conversionsB / this.visitorsB;
      var pooled = (this.conversionsA + this.conversionsB) / (this.visitorsA + this.visitorsB);
      var se = Math.sqrt(pooled * (1 - pooled) * (1/this.visitorsA + 1/this.visitorsB));
      return (pB - pA) / se;
    },
    absZ: function () { return Math.abs(this.zScore()); },
    verdict: function () { var z = this.absZ(); return z > 2.576 ? "99% 显著" : z > 1.96 ? "95% 显著" : z > 1.645 ? "90% 有趋势" : "不显著"; },
    tone: function () { return this.absZ() > 1.96 ? "success" : this.absZ() > 1.645 ? "warning" : "info"; }
  },
  layout: {
    "card:abtest": {
      title: "A/B 实验结果",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:aField": { "input:visitorsA": { label: "A 组访客", "$value": "g.visitorsA", type: "number", onchange: "g.visitorsA = Number($event || 0)" }, "input:conversionsA": { label: "A 组转化", "$value": "g.conversionsA", type: "number", onchange: "g.conversionsA = Number($event || 0)" } },
        "column:bField": { "input:visitorsB": { label: "B 组访客", "$value": "g.visitorsB", type: "number", onchange: "g.visitorsB = Number($event || 0)" }, "input:conversionsB": { label: "B 组转化", "$value": "g.conversionsB", type: "number", onchange: "g.conversionsB = Number($event || 0)" } }
      },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:rateA": { label: "A 组转化率", "$value": "g.rateA()", unit: "%" },
        "stat:rateB": { label: "B 组转化率", "$value": "g.rateB()", unit: "%" },
        "stat:lift": { label: "提升幅度", "$value": "g.lift()", unit: "%" },
        "stat:zScore": { label: "z 统计量", "$value": "g.absZ().toFixed(3)" }
      },
      "badge:verdict": { "$label": "g.verdict()", "$tone": "g.tone()" },
      "callout:advice": { "$tone": "g.tone()", "$text": "g.absZ() > 1.96 ? '结果统计显著，可以采纳 B 组方案。统计显著 ≠ 业务显著。' : g.absZ() > 1.645 ? '有趋势但不显著，建议延长实验周期。' : '差异不显著。增加样本或检查实验设计。'" }
    }
  }
}
```

Fallback：A 组 4.8%, B 组 6.0% → 提升 25%，|z| ≈ 2.58 → 99% 显著。

- **MDE（最小可检测效应）**：预期提升越小，所需样本量越大
- **运行期**：至少跑满一个完整业务周期，避免工作日/周末效应
- **偷看问题**：每天看一次结果 → 累积 I 类错误率暴涨。用序贯检验或忍住不看
