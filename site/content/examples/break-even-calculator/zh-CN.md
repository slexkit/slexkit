---
title: 盈亏平衡分析
category: 金融财务
status: published
order: 42
summary: 输入固定成本、单价和单位变动成本，计算盈亏平衡点销量和产能利用率。
tags: finance, break-even, cost-analysis
components: card, input, slider, formula, stat, progress, callout, badge, grid, column
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 盈亏平衡分析

"卖多少件才能不亏钱？"——固定成本和变动成本决定了这条生死线。

## 核心公式

$$Q_{BE} = \frac{\text{FixedCost}}{\text{Price} - \text{UnitCost}}$$

```slex
{
  slex: "0.1",
  namespace: "example_break_even_calculator",
  g: {
    fixedCost: 50000, price: 199, unitCost: 89, currentVolume: 800,
    margin: function () { return this.price - this.unitCost; },
    beVolume: function () { return this.margin() > 0 ? Math.ceil(this.fixedCost / this.margin()) : Infinity; },
    beRevenue: function () { return this.beVolume() * this.price; },
    currentProfit: function () { return this.margin() * this.currentVolume - this.fixedCost; },
    capacityUtil: function () { return this.beVolume() > 0 ? Math.min(100, (this.currentVolume / this.beVolume() * 100).toFixed(1)) : 0; },
    status: function () { return this.currentProfit() >= 0 ? "盈利" : "亏损"; },
    tone: function () { return this.currentProfit() >= 0 ? "success" : "danger"; }
  },
  layout: {
    "card:be": {
      title: "盈亏平衡分析",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:fcField": { "input:fixedCost": { label: "固定成本", "$value": "g.fixedCost", type: "number", unit: "元/月", onchange: "g.fixedCost = Number($event || 0)" }, "slider:fixedCost": { label: "固定成本", "$value": "g.fixedCost", min: 1000, max: 500000, step: 1000, unit: "元", onchange: "g.fixedCost = Number($event)" } },
        "column:priceField": { "input:price": { label: "单价", "$value": "g.price", type: "number", unit: "元", onchange: "g.price = Number($event || 0)" }, "slider:price": { label: "单价", "$value": "g.price", min: 10, max: 5000, step: 10, unit: "元", onchange: "g.price = Number($event)" } },
        "column:ucField": { "input:unitCost": { label: "变动成本", "$value": "g.unitCost", type: "number", unit: "元", onchange: "g.unitCost = Number($event || 0)" }, "slider:unitCost": { label: "变动成本", "$value": "g.unitCost", min: 0, max: 2000, step: 10, unit: "元", onchange: "g.unitCost = Number($event)" } },
        "column:cvField": { "input:currentVolume": { label: "当前销量", "$value": "g.currentVolume", type: "number", unit: "件/月", onchange: "g.currentVolume = Number($event || 0)" }, "slider:currentVolume": { label: "当前销量", "$value": "g.currentVolume", min: 0, max: 5000, step: 10, unit: "件", onchange: "g.currentVolume = Number($event)" } }
      },
      "formula:eq": { "$tex": "'Q_{BE} = \\\\frac{' + g.fixedCost.toLocaleString() + '}{' + g.price + ' - ' + g.unitCost + '} = ' + g.beVolume() + '\\\\text{ 件}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:margin": { label: "单位毛利", "$value": "g.margin()", unit: "元" },
        "stat:beVolume": { label: "盈亏平衡点", "$value": "Number.isFinite(g.beVolume()) ? g.beVolume().toLocaleString() : '毛利为零'", unit: "件" },
        "stat:profit": { label: "当前利润", "$value": "g.currentProfit().toLocaleString()", unit: "元" }
      },
      "progress:util": { label: "产能利用率", "$value": "g.capacityUtil()" },
      "badge:status": { "$label": "g.status()", "$tone": "g.tone()" },
      "callout:advice": { "$tone": "g.tone()", "$text": "g.currentProfit() >= 0 ? '已超越盈亏平衡点。安全边际 ' + (g.currentVolume - g.beVolume()) + ' 件。' : '尚未盈利。距平衡点还差 ' + (g.beVolume() - g.currentVolume) + ' 件。'" }
    }
  }
}
```

Fallback：固定 5 万, 单价 199, 变动 89 → BE 455 件, 当前 800 件 → 盈利 38,000 元。

- 安全边际 = 当前销量 - BE 销量，越大越好
- 毛利每增加 1 元，BE 点大幅下降
- 越过 BE 点后每多 1 件销量全额贡献利润
