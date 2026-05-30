---
title: SLO 错误预算面板
category: 软件工程
status: published
order: 22
summary: 输入 SLO 目标和请求量，实时计算错误预算消耗率、剩余预算和预计耗尽天数。
tags: slo, error-budget, observability, sre
components: card, input, slider, formula, stat, callout, badge, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# SLO 错误预算面板

SLO 是可靠性工程的基石。99.9% 不是"允许 0.1% 失败"——而是"给你 0.1% 的预算去冒险"。

## 核心公式

$$\text{Budget} = \text{TotalRequests} \times (1 - \frac{\text{SLO}}{100})$$

```slex
{
  slex: "0.1",
  namespace: "example_slo_error_panel",
  g: {
    sloTarget: 99.9, totalRequests: 1000000, failedRequests: 800, windowDays: 30,
    errorBudget: function () { return Math.round(this.totalRequests * (100 - this.sloTarget) / 100); },
    remainingBudget: function () { return Math.max(0, this.errorBudget() - this.failedRequests); },
    budgetPercent: function () { return Math.min(100, (this.failedRequests / this.errorBudget() * 100)); },
    dailyBurnRate: function () { return this.windowDays > 0 ? Math.round(this.failedRequests / this.windowDays) : 0; },
    daysUntilExhausted: function () { return this.dailyBurnRate() > 0 ? Math.floor(this.remainingBudget() / this.dailyBurnRate()) : Infinity; },
    tone: function () { var p = this.budgetPercent(); return p >= 100 ? "danger" : p >= 80 ? "warning" : p >= 50 ? "info" : "success"; },
    verdict: function () { var p = this.budgetPercent(); return p >= 100 ? "预算耗尽" : p >= 80 ? "预算紧张" : p >= 50 ? "需关注" : "预算充足"; }
  },
  layout: {
    "card:slo": {
      title: "SLO 错误预算",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:sloField": { "input:sloTarget": { label: "SLO 目标", "$value": "g.sloTarget", type: "number", unit: "%", onchange: "g.sloTarget = Number($event || 0)" }, "slider:sloTarget": { label: "SLO", "$value": "g.sloTarget", min: 99, max: 99.999, step: 0.001, unit: "%", onchange: "g.sloTarget = Number($event)" } },
        "column:totalField": { "input:totalRequests": { label: "总请求量", "$value": "g.totalRequests", type: "number", onchange: "g.totalRequests = Number($event || 0)" }, "slider:totalRequests": { label: "总请求量", "$value": "g.totalRequests", min: 100000, max: 100000000, step: 100000, onchange: "g.totalRequests = Number($event)" } },
        "column:failField": { "input:failedRequests": { label: "失败请求", "$value": "g.failedRequests", type: "number", onchange: "g.failedRequests = Number($event || 0)" }, "slider:failedRequests": { label: "失败请求", "$value": "g.failedRequests", min: 0, max: 50000, step: 100, onchange: "g.failedRequests = Number($event)" } },
        "column:windowField": { "input:windowDays": { label: "评估窗口", "$value": "g.windowDays", type: "number", unit: "天", onchange: "g.windowDays = Number($event || 0)" }, "slider:windowDays": { label: "窗口", "$value": "g.windowDays", min: 1, max: 90, step: 1, unit: "天", onchange: "g.windowDays = Number($event)" } }
      },
      "formula:eq": { "$tex": "'\\\\text{Budget} = ' + g.totalRequests.toLocaleString() + ' \\\\times (1 - \\\\frac{' + g.sloTarget + '}{100}) = ' + g.errorBudget().toLocaleString() + '\\\\text{ 次}'" },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:errorBudget": { label: "错误预算", "$value": "g.errorBudget().toLocaleString()", unit: "次" },
        "stat:remaining": { label: "剩余预算", "$value": "g.remainingBudget().toLocaleString()", unit: "次" },
        "stat:daysLeft": { label: "预计耗尽", "$value": "Number.isFinite(g.daysUntilExhausted()) ? g.daysUntilExhausted() : '∞'", unit: "天" },
        "badge:status": { "$label": "g.verdict()", "$tone": "g.tone()" }
      },
      "callout:advice": { "$tone": "g.tone()", "$text": "g.budgetPercent() >= 100 ? '错误预算已耗尽！冻结所有非紧急变更。' : g.budgetPercent() >= 80 ? '预算 > 80%，减缓变更节奏。' : g.budgetPercent() >= 50 ? '预算过半，保持关注。' : '预算充足，可安心推进变更。'" }
    }
  }
}
```

Fallback：SLO 99.9%，百万请求 → 预算 1000 次，消耗 800 → 剩余 200。

| SLO | 百万请求预算 | 月允许中断 |
|-----|-----------|----------|
| 99% | 10000 次 | 7.2 小时 |
| 99.9% | 1000 次 | 43 分钟 |
| 99.99% | 100 次 | 4.3 分钟 |

- SLO 是内部目标，SLA 是对外承诺（通常比 SLO 宽松）
- 错误预算耗尽 → 冻结变更 → 等下次窗口重置
- Burn Rate Alert：1 小时消耗 2% 年度预算（短期急降）
