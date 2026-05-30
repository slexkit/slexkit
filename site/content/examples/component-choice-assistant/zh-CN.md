---
title: 组件选型助手
category: 知识库与文档
status: draft
order: 16
summary: 按使用场景选择合适的 SlexKit 接入方式，展示对应代码片段。
tags: component, choice, docs
components: card, select, callout
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 组件选型助手

## 场景

AI 回答经常会把所有内容都放进 card。这个笔记用一个小助手提示：先判断语义，再选择组件。

## 复核块

```slex
{
  slex: "0.1",
  namespace: "example_component_choice_assistant",
  g: { ready: false, choice: "plain", message: function () { return this.ready ? "可以进入发布说明。" : "需要继续补充上下文。"; } },
  layout: {
    "card:note": {
      title: "组件选型助手",
      "table:context": { columns: ["项目", "结论", "备注"], rows: [["只读解释","text/callout","不用输入控件"],["多项确认","checkbox/table","保留审计轨迹"],["单选策略","radio/select","避免多个互斥状态"]] },
      "select:choice": { label: "当前场景", "$value": "g.choice", options: [{ label: "普通 Markdown", value: "plain" }, { label: "Streamdown", value: "streamdown" }, { label: "Obsidian", value: "obsidian" }], onchange: "g.choice = String($event)" },
      "callout:message": { "$tone": "g.ready ? 'success' : 'info'", "$text": "g.message()" }
    }
  }
}
```

## 记录

这不是完整应用，而是一段文档里的局部状态：读者阅读上下文时，可以顺手完成判断或确认。

Fallback：组件选型应从内容语义出发：解释用 text/callout，确认用 checkbox/table，互斥策略用 radio/select。
