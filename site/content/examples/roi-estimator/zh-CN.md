---
title: 自建还是外购决策
category: 金融财务
status: published
order: 41
summary: Build vs Buy 决策矩阵——功能覆盖、成本对比、时间线、风险四维度评估，自动推荐方案。
tags: build-vs-buy, decision, procurement, cost
components: section, card, select, slider, checkbox, badge, callout, accordion, table, grid, column
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 自建还是外购决策

技术团队永恒的难题：这个功能是自己做，还是买现成的？这里提供一个结构化决策框架——不是算一个数字，而是多维度权衡。

```slex
{
  slex: "0.1",
  namespace: "example_build_vs_buy",
  g: {
    scope: "core",
    buildFit: 60, buildTime: 6, buildCost: 80,
    buyFit: 85, buyTime: 1, buyCost: 40, buyVendorLock: 30,
    buildTotal: function () { return (this.buildFit + (100 - this.buildCost) + (100 - this.buildTime * 10)) / 3; },
    buyTotal: function () { return (this.buyFit + (100 - this.buyCost) + (100 - this.buyTime * 10) - this.buyVendorLock * 0.5) / 3; },
    recommendation: function () {
      if (this.scope === "core") return this.buildTotal() >= this.buyTotal() ? "自建" : "外购（但建议评估长期成本）";
      return this.buyTotal() >= this.buildTotal() ? "外购" : "自建（非核心功能自建需谨慎）";
    },
    diff: function () { return Math.abs(this.buildTotal() - this.buyTotal()); }
  },
  layout: {
    "section:decision": {
      eyebrow: "技术决策",
      title: "自建还是外购决策",
      subtitle: "对比两个方案的各维度评分，系统综合推荐。拖滑块调整评分看结论变化。",
      "select:scope": {
        label: "功能定位",
        "$value": "g.scope",
        options: [
          { label: "核心业务（差异化的关键）", value: "core" },
          { label: "辅助功能（非核心）", value: "non-core" }
        ],
        onchange: "g.scope = String($event)"
      },
      "table:comparison": {
        columns: ["维度", "自建方案", "外购方案"],
        rows: [
          ["功能匹配度", "g.buildFit + '%'", "g.buyFit + '%'"],
          ["上线时间", "g.buildTime + ' 个月'", "g.buyTime + ' 个月'"],
          ["成本评分", "g.buildCost + '/100'", "g.buyCost + '/100'"],
          ["供应商锁定", "—", "g.buyVendorLock + '/100'"]
        ]
      },
      "grid:sliders": {
        columns: 1, mdColumns: 2,
        "column:build": {
          "card:buildSliders": {
            title: "自建方案",
            "slider:buildFit": { label: "功能匹配度", "$value": "g.buildFit", min: 0, max: 100, step: 5, onchange: "g.buildFit = Number($event)" },
            "slider:buildTime": { label: "上线时间（月）", "$value": "g.buildTime", min: 1, max: 24, step: 1, unit: "月", onchange: "g.buildTime = Number($event)" },
            "slider:buildCost": { label: "成本评分", "$value": "g.buildCost", min: 0, max: 100, step: 5, onchange: "g.buildCost = Number($event)" }
          }
        },
        "column:buy": {
          "card:buySliders": {
            title: "外购方案",
            "slider:buyFit": { label: "功能匹配度", "$value": "g.buyFit", min: 0, max: 100, step: 5, onchange: "g.buyFit = Number($event)" },
            "slider:buyTime": { label: "上线时间（月）", "$value": "g.buyTime", min: 1, max: 24, step: 1, unit: "月", onchange: "g.buyTime = Number($event)" },
            "slider:buyCost": { label: "成本评分", "$value": "g.buyCost", min: 0, max: 100, step: 5, onchange: "g.buyCost = Number($event)" },
            "slider:lock": { label: "供应商锁定风险", "$value": "g.buyVendorLock", min: 0, max: 100, step: 5, onchange: "g.buyVendorLock = Number($event)" }
          }
        }
      },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:buildScore": { label: "自建综合得分", "$value": "g.buildTotal().toFixed(1)" },
        "stat:buyScore": { label: "外购综合得分", "$value": "g.buyTotal().toFixed(1)" },
        "badge:winner": { "$label": "'建议：' + g.recommendation()", "$tone": "g.recommendation() === '自建' || g.recommendation().startsWith('自建') ? 'info' : 'success'" }
      },
      "callout:advice": {
        "$tone": "g.diff() < 10 ? 'warning' : 'info'",
        "$text": "g.diff() < 10 ? '两个方案得分非常接近——建议引入更多决策者参与讨论，或做小范围 POC。' : g.recommendation() + ' 方案的得分明显更高。但请结合团队实际能力和战略方向做最终决定。'"
      },
      "accordion:detail": {
        multiple: true,
        items: [
          { value: "cost", label: "成本说明", content: "成本评分越低越好（0 = 零成本，100 = 极高成本）。外购方案需额外考虑供应商锁定风险。" },
          { value: "scope", label: "核心 vs 非核心策略", content: "核心业务功能通常倾向自建以保持控制力和差异化。非核心功能外购可以释放团队精力。" },
          { value: "hybrid", label: "第三条路：混合方案", content: "也可以考虑先外购快速上线，同时内部规划自建替代方案，等自建成熟后迁移。" }
        ]
      }
    }
  }
}
```

**Build vs Buy 决策模型的要点：**

- `select` 定义功能定位（核心/非核心），影响决策偏向
- 两套 slider 独立调整各自评分
- `buildTotal()` 和 `buyTotal()` 用加权公式计算综合得分
- `recommendation()` 结合功能定位和得分给出建议
- accordion 提供额外的决策指南（成本说明、策略建议、混合方案）

这个框架帮你把"凭感觉拍脑袋"变成"有依据的比较"。
