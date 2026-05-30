---
title: 术语速查卡
category: 知识库与文档
status: draft
order: 13
summary: 术语速查卡，按分类快速查找 SlexKit 核心概念和用法。
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
