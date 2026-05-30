---
title: 工具调用审批面板
category: AI 与 Agent 工作流
status: published
order: 1
summary: 把 Agent 高风险工具调用转成可审阅、可提交的 human-in-the-loop 面板。
tags: toolhost, approval, agent
components: card, checkbox, input, submit, badge, callout, grid
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 工具调用审批面板

Agent 要帮你部署服务、发通知——这些操作不该全自动执行。Human-in-the-loop：AI 做决策，人来拍板。

```
tool: deploy_service({ service: 'search-api', env: 'staging' })
```

```slex
{
  slex: "0.1",
  namespace: "example_tool_approval_panel",
  g: {
    approved: false, reviewed: false, note: "仅允许在 staging 执行", risk: "medium",
    status: function () { if (!this.reviewed) return "等待人工审阅"; return this.approved ? "已批准，可提交" : "已拒绝，应取消"; }
  },
  layout: {
    "card:approval": {
      title: "工具调用审批",
      "callout:risk": { tone: "warning", title: "风险提示", text: "Agent 请求执行 deploy_service，目标环境为 staging。" },
      "grid:checks": {
        columns: 1, mdColumns: 2,
        "checkbox:reviewed": { label: "我已阅读参数和影响范围", "$checked": "g.reviewed", onchange: "g.reviewed = Boolean($event)" },
        "checkbox:approved": { label: "批准本次调用", "$checked": "g.approved", onchange: "g.approved = Boolean($event)" }
      },
      "input:note": { label: "审批备注", "$value": "g.note", onchange: "g.note = String($event || '')" },
      "badge:status": { "$label": "g.status()", "$tone": "g.approved ? 'success' : g.reviewed ? 'danger' : 'warning'" },
      "submit:decision": { submitLabel: "提交决策", ignoreLabel: "跳过", returnKeys: ["reviewed", "approved", "note", "risk"] }
    }
  }
}
```

三个关键状态：**等待审阅**（warning）→ **已拒绝**（danger）/ **已批准**（success）。`submit` 收集的 `{ reviewed, approved, note, risk }` 直接返回给宿主注入 Agent 下一轮推理。

**风险分级**：读日志、查元数据 → 自动执行。部署 staging、发通知 → 需审阅。生产、删数据、支付 → 必须批准。

Fallback：Agent 工具调用需经人工审阅后方可批准执行。
