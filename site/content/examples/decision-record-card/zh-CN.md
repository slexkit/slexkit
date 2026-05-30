---
title: 决策记录卡
category: 产品与协作
status: draft
order: 45
summary: 决策记录的交互式评估与确认，上下文、备选方案和最终决策跨段落联动。
tags: adr, decision, product
components: card, badge, table
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 决策记录卡

## 记录

ADR-007：示例中心放在 site 内，而不是单独开仓库。

```slex
{
  slex: "0.1",
  namespace: "example_decision_record_card",
  g: { a: true, b: false, c: true, done: function () { return [this.a, this.b, this.c].filter(Boolean).length; } },
  layout: {
    "card:work": {
      title: "决策记录卡",
      "table:items": { columns: ["项目", "说明", "备注"], rows: [["site 内","同源发布","内容量变大"],["独立仓库","隔离清晰","索引成本高"]] },
      "checkbox:a": { label: "第一项已确认", "$checked": "g.a", onchange: "g.a = Boolean($event)" },
      "checkbox:b": { label: "第二项已确认", "$checked": "g.b", onchange: "g.b = Boolean($event)" },
      "checkbox:c": { label: "第三项已确认", "$checked": "g.c", onchange: "g.c = Boolean($event)" },
      "callout:result": { "$tone": "g.done() >= 2 ? 'success' : 'warning'", "$text": "'已确认 ' + g.done() + '/3 项。'" }
    }
  }
}
```

```slex
{
  slex: "0.1",
  namespace: "example_decision_record_card",
  layout: { "callout:followup": { "$tone": "g.done() >= 2 ? 'success' : 'info'", "$text": "'当前已确认 ' + g.done() + '/3 项。'" } }
}
```

## 后续

产品协作类内容更像会议纪要、ADR 或评审笔记。交互块用于确认局部状态，而不是替代正文。

Fallback：ADR 接受 site 内 examples 路由，风险是内容量变大但索引更稳定。
