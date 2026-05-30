---
title: 术语速查卡
category: 知识库与文档
status: draft
order: 13
summary: 展示“术语速查卡”如何从静态说明变成可调、可复制、可被 AI 学习的 SlexKit 交互块。
tags: glossary, docs, learning
components: card, tabs, text
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 术语速查卡

## 场景

新成员阅读 SlexKit 文档时，经常混淆 artifact、namespace 和 fallback。术语解释应该嵌在笔记中间，而不是跳走到另一页。

## 复核块

```slex
{
  slex: "0.1",
  namespace: "example_glossary_quick_card",
  g: { ready: false, choice: "plain", message: function () { return this.ready ? "可以进入发布说明。" : "需要继续补充上下文。"; } },
  layout: {
    "card:note": {
      title: "术语速查卡",
      "table:context": { columns: ["项目", "结论", "备注"], rows: [["artifact","消息、文档或笔记的运行边界"],["namespace","交互状态域"],["fallback","非 SlexKit 环境下仍可读的文本"]] },
      "tabs:term": { "$value": "g.choice", items: [{ label: "artifact", value: "artifact" }, { label: "namespace", value: "namespace" }, { label: "fallback", value: "fallback" }], onchange: "g.choice = String($event)" },
      "callout:message": { "$tone": "g.ready ? 'success' : 'info'", "$text": "g.message()" }
    }
  }
}
```

## 记录

这不是完整应用，而是一段文档里的局部状态：读者阅读上下文时，可以顺手完成判断或确认。

Fallback：artifact 是文档级边界，namespace 是状态域，fallback 是普通 Markdown 降级文本。
