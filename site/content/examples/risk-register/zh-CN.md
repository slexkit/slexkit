---
title: 风险登记表
category: 产品与协作
status: draft
order: 44
summary: 让风险项可以被负责人重新评估概率、影响和处置策略。
tags: risk, planning, collaboration
components: card, select, slider, badge, submit
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 风险登记表

风险登记不应该只是静态表格。这个示例让 AI 生成的风险项可以被负责人重新评估概率、影响和处置策略。

```slex
{
  slex: "0.1",
  namespace: "example_risk_register",
  g: { probability: 3, impact: 4, owner: "产品负责人", mitigation: "先发布只读示例中心，再补编辑能力", score: function () { return this.probability * this.impact; } },
  layout: {
    "card:risk": {
      title: "风险登记表",
      "text:item": { text: "风险：示例数量快速增加后，导航和内容质量难以维护。" },
      "slider:p": { label: "发生概率", "$value": "g.probability", min: 1, max: 5, step: 1, onchange: "g.probability = Number($event)" },
      "slider:i": { label: "影响程度", "$value": "g.impact", min: 1, max: 5, step: 1, onchange: "g.impact = Number($event)" },
      "input:owner": { label: "负责人", "$value": "g.owner", onchange: "g.owner = String($event || '')" },
      "input:mitigation": { label: "缓解策略", "$value": "g.mitigation", onchange: "g.mitigation = String($event || '')" },
      "badge:score": { "$label": "'风险分：' + g.score()", "$tone": "g.score() >= 15 ? 'danger' : g.score() >= 8 ? 'warning' : 'success'" },
      "submit:save": { submitLabel: "保存风险", ignoreLabel: "忽略", returnKeys: ["probability", "impact", "owner", "mitigation"] }
    }
  }
}
```

Fallback：风险分由发生概率和影响程度相乘得到。
