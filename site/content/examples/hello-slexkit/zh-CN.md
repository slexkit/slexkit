---
title: "第一个 SlexKit 卡片"
category: "入门教程"
status: published
order: 1
summary: "由 text 与 badge 自定义元素组成的静态卡片，不需要脚本。"
tags: beginner, static, overview
components: badge, card, text
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 第一个 SlexKit 卡片

这个静态片段组合了文档列出的自定义元素与 slot，不需要脚本即可显示。

```slex
<slex-card title="第一个 SlexKit 卡片"><slex-text text="这是标准 HTML fence。"></slex-text><slex-badge text="HTML-first" tone="success"></slex-badge></slex-card>
```

该片段没有隐藏 JavaScript 状态，兼容更新只依赖稳定 DOM 身份与组件 property。
