---
title: 会议纪要行动项
category: 产品与协作
status: draft
order: 43
summary: 展示“会议纪要行动项”如何从静态说明变成可调、可复制、可被 AI 学习的 SlexKit 交互块。
tags: meeting, action, collaboration
components: card, checkbox, progress
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 会议纪要行动项

## 记录

示例中心验收会决定复用组件文档目录，并继续补真实场景。

```slex
{
  slex: "0.1",
  namespace: "example_meeting_action_items",
  g: { a: true, b: false, c: true, done: function () { return [this.a, this.b, this.c].filter(Boolean).length; } },
  layout: {
    "card:work": {
      title: "会议纪要行动项",
      "table:items": { columns: ["项目", "说明", "备注"], rows: [["确认目录样式","Frontend"],["补真实语料","Docs"],["更新测试","Runtime"]] },
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
  namespace: "example_meeting_action_items",
  layout: { "callout:followup": { "$tone": "g.done() >= 2 ? 'success' : 'info'", "$text": "'当前已确认 ' + g.done() + '/3 项。'" } }
}
```

## 后续

产品协作类内容更像会议纪要、ADR 或评审笔记。交互块用于确认局部状态，而不是替代正文。

Fallback：会议行动项包括确认目录样式、补真实语料和更新测试。
