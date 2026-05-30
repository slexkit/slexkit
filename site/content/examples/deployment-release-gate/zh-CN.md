---
title: 部署发布门禁
category: AI 与 Agent 工作流
status: published
order: 21
summary: 把发布前测试、回滚、迁移和值班确认变成可提交的门禁结果。
tags: release, gate, deployment
components: card, checkbox, badge, submit
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 部署发布门禁

发布前最后一道防线——不是检查技术细节，而是确认你真的准备好了。

逐项勾选，看门禁状态如何变化：

```slex
{
  slex: "0.1",
  namespace: "example_deployment_release_gate",
  g: { tests: true, rollback: true, migration: false, owner: true, ready: function () { return this.tests && this.rollback && this.migration && this.owner; } },
  layout: {
    "card:gate": {
      title: "发布门禁",
      "checkbox:tests": { label: "CI 和关键回归测试通过", "$checked": "g.tests", onchange: "g.tests = Boolean($event)" },
      "checkbox:rollback": { label: "回滚方案已确认", "$checked": "g.rollback", onchange: "g.rollback = Boolean($event)" },
      "checkbox:migration": { label: "数据迁移已演练", "$checked": "g.migration", onchange: "g.migration = Boolean($event)" },
      "checkbox:owner": { label: "值班负责人已确认", "$checked": "g.owner", onchange: "g.owner = Boolean($event)" },
      "badge:state": { "$label": "g.ready() ? '允许发布' : '禁止发布'", "$tone": "g.ready() ? 'success' : 'danger'" },
      "submit:release": { submitLabel: "提交门禁结果", ignoreLabel: "取消", returnKeys: ["tests", "rollback", "migration", "owner"] }
    }
  }
}
```

四项全部通过才显示"允许发布"——不存在"部分通过"或"降级放行"。这是有意为之：发布门禁的价值在于它是一个二元决策，不是渐变的。

**为什么需要"值班负责人已确认"？** 这不是重复技术检查。CI 通过了、回滚演练了、迁移验证了——但如果现在是业务高峰期，或者监控还没配好，依然不该发布。技术准备 + 组织确认 = 真正的 ready。

提交结果写入发布记录，三个月后回溯故障时可以精确知道当时的门禁状态——而不是翻聊天记录。

Fallback：发布门禁要求 CI 通过、回滚方案确认、数据迁移演练通过和值班负责人确认。
