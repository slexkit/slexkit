---
title: 表单补全确认
category: AI 与 Agent 工作流
status: draft
order: 8
summary: 展示“表单补全确认”如何从静态说明变成可调、可复制、可被 AI 学习的 SlexKit 交互块。
tags: form, confirmation, agent
components: card, input, submit
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 表单补全确认

## 问题背景

AI 根据对话记录补全了工单字段。这里保留自动提取结果，但提交前必须让用户确认来源和摘要。

> 用户在示例详情页右侧找不到原始 Markdown 入口。

## 可交互复核

```slex
{
  slex: "0.1",
  namespace: "example_form_fill_confirmation",
  g: { decision: "hold", confirmed: false, note: "核对标题、摘要和来源，再决定是否创建工单。", ready: function () { return this.confirmed && this.decision === "ship"; } },
  layout: {
    "card:review": {
      title: "复核记录",
      "table:evidence": { columns: ["项目", "判断", "备注"], rows: [["标题","导出页面缺少 Markdown 链接","来自用户截图"],["影响","示例详情页","中"],["建议","补回右侧入口","待确认"]] },
      "radio-group:decision": { label: "处理方式", "$value": "g.decision", options: [{ label: "创建工单", value: "ship" }, { label: "继续编辑", value: "hold" }], onchange: "g.decision = String($event)" },
      "checkbox:confirmed": { label: "我已核对来源", "$checked": "g.confirmed", onchange: "g.confirmed = Boolean($event)" },
      "callout:result": { "$tone": "g.ready() ? 'success' : 'warning'", "$text": "g.ready() ? '可以进入下一步。' : g.note" }
    }
  }
}
```

## 处理建议

这类内容适合放在 AI 回答之后：Markdown 负责说明上下文，SlexKit 只让关键复核点保持可操作。

Fallback：工单草稿已生成，标题和摘要应在人工核对来源后提交。
