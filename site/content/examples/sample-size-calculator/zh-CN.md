---
title: 样本量计算器
category: 数据科学
status: published
order: 32
summary: 输入期望效应量和统计功效，计算 A/B 实验所需的最小样本量。
tags: statistics, sample-size, power-analysis, experiment
components: card, input, select, formula, stat, callout, grid
difficulty: 高级
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 样本量计算器

"需要多大样本量？"——这是 A/B 测试设计阶段的第一个问题。样本量不足 → 真实效应检测不出；样本量过大 → 浪费流量。

## 核心公式

$$n = \frac{(z_{\alpha/2} + z_\beta)^2 \times [p_A(1-p_A) + p_B(1-p_B)]}{(p_B - p_A)^2}$$

```slex
{
  slex: "0.1",
  namespace: "example_sample_size_calculator",
  g: {
    baselineRate: 10, effectSize: 2, alpha: 0.05, power: 0.8,
    zAlpha: function () { return this.alpha <= 0.01 ? 2.576 : this.alpha <= 0.05 ? 1.96 : 0; },
    zBeta: function () { return this.power >= 0.9 ? 1.282 : this.power >= 0.8 ? 0.842 : 0; },
    pA: function () { return this.baselineRate / 100; },
    pB: function () { return (this.baselineRate + this.effectSize) / 100; },
    nPerGroup: function () {
      var pa = this.pA(), pb = this.pB();
      var n = Math.pow(this.zAlpha() + this.zBeta(), 2) * (pa * (1-pa) + pb * (1-pb)) / Math.pow(pb - pa, 2);
      return this.effectSize > 0 ? Math.ceil(n) : Infinity;
    },
    totalN: function () { return this.nPerGroup() * 2; }
  },
  layout: {
    "card:size": {
      title: "样本量计算",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "input:baselineRate": { label: "基线转化率", "$value": "g.baselineRate", type: "number", unit: "%", onchange: "g.baselineRate = Number($event || 0)" },
        "input:effectSize": { label: "期望提升", "$value": "g.effectSize", type: "number", unit: "pp", onchange: "g.effectSize = Number($event || 0)" },
        "select:alpha": { label: "显著性 α", "$value": "g.alpha", options: [{ label: "5%", value: 0.05 }, { label: "1%", value: 0.01 }], onchange: "g.alpha = Number($event)" },
        "select:power": { label: "功效 1-β", "$value": "g.power", options: [{ label: "80%", value: 0.8 }, { label: "90%", value: 0.9 }], onchange: "g.power = Number($event)" }
      },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:nPerGroup": { label: "每组所需", "$value": "Number.isFinite(g.nPerGroup()) ? g.nPerGroup().toLocaleString() : '效应量为零'", unit: "人" },
        "stat:totalN": { label: "总样本量", "$value": "Number.isFinite(g.totalN()) ? g.totalN().toLocaleString() : '-'", unit: "人" }
      },
      "callout:advice": { tone: "info", "$text": "Number.isFinite(g.nPerGroup()) ? '建议运行至少 ' + Math.ceil(g.totalN() / 200) + ' 天（日均 200 访客）。' : '期望效应量不能为零。'" }
    }
  }
}
```

Fallback：基线 10%, 提升 2pp, α=5%, Power 80% → 每组 3848 人，总计 7696 人。

| 效应量 (pp) | 每组 n (α=5%, Power 80%) |
|-----------|------------------------|
| 0.5 | ~62,000 |
| 1.0 | ~15,500 |
| 2.0 | ~3,900 |
| 5.0 | ~620 |

- 效应量越小，样本量指数增长
- Power 从 80% → 90%，样本增加约 33%
