---
title: 置信区间计算器
category: 数据科学
status: published
order: 31
summary: 输入样本均值、标准差、样本量和置信水平，计算均值的置信区间。
tags: statistics, confidence-interval, estimation
components: card, input, select, formula, stat, callout, grid
difficulty: 进阶
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 置信区间计算器

"平均响应时间 245ms"——这个数字本身没有意义。真正的价值在"95% 把握真实均值 230–260ms"。置信区间给点估计加上可信度边框。

## 核心公式

$$\bar{x} \pm z_{\alpha/2} \times \frac{s}{\sqrt{n}}$$

```slex
{
  slex: "0.1",
  namespace: "example_confidence_interval",
  g: {
    sampleMean: 245, sampleStd: 30, sampleSize: 100, confLevel: 95,
    zValue: function () { var map = { 90: 1.645, 95: 1.960, 99: 2.576, "99.9": 3.291 }; return map[String(this.confLevel)] || 1.960; },
    margin: function () { return this.zValue() * this.sampleStd / Math.sqrt(this.sampleSize); },
    lower: function () { return this.sampleMean - this.margin(); },
    upper: function () { return this.sampleMean + this.margin(); },
    precision: function () { return (this.margin() / this.sampleMean * 100).toFixed(1); }
  },
  layout: {
    "card:ci": {
      title: "置信区间",
      "grid:params": {
        columns: 1, mdColumns: 3,
        "input:sampleMean": { label: "样本均值 x̄", "$value": "g.sampleMean", type: "number", onchange: "g.sampleMean = Number($event || 0)" },
        "input:sampleStd": { label: "标准差 s", "$value": "g.sampleStd", type: "number", onchange: "g.sampleStd = Number($event || 0)" },
        "input:sampleSize": { label: "样本量 n", "$value": "g.sampleSize", type: "number", onchange: "g.sampleSize = Number($event || 0)" },
        "select:confLevel": { label: "置信水平", "$value": "g.confLevel", options: [{ label: "90%", value: 90 }, { label: "95%", value: 95 }, { label: "99%", value: 99 }, { label: "99.9%", value: "99.9" }], onchange: "g.confLevel = Number($event)" }
      },
      "formula:eq": { "$tex": "'\\\\bar{x} \\\\pm z \\\\times \\\\frac{s}{\\\\sqrt{n}} = ' + g.sampleMean + ' \\\\pm ' + g.zValue().toFixed(3) + ' \\\\times \\\\frac{' + g.sampleStd + '}{\\\\sqrt{' + g.sampleSize + '}}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:lower": { label: "下限", "$value": "g.lower().toFixed(2)" },
        "stat:upper": { label: "上限", "$value": "g.upper().toFixed(2)" },
        "stat:margin": { label: "误差幅度", "$value": "'±' + g.margin().toFixed(2)" }
      },
      "callout:note": { tone: "info", "$text": "'95% 置信区间 [' + g.lower().toFixed(1) + ', ' + g.upper().toFixed(1) + ']'" }
    }
  }
}
```

Fallback：x̄=245, s=30, n=100 → 95% CI = [239.1, 250.9]。

- 区间宽度反比于 √n：精度提高 1 倍需样本翻 4 倍
- CI ≠ "95% 的数据落在这里"——那是预测区间
- n > 30 用 z 分布，n ≤ 30 用 t 分布
