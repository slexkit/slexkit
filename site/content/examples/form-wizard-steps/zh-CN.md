---
title: "ToolHost 表单提问"
category: "配置向导"
status: published
order: 12
summary: "ToolHost 在对话中渲染表单卡片，收集项目信息并提交结构化结果。"
tags: toolhost, form, ai, conversation
components: native-html
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# ToolHost 表单提问

ToolHost 在可信宿主侧渲染表单 UI，并返回明确的 submitted 或 ignored 结构化结果；它与只负责展示的 `slex` 执行相互独立。

```slex
<section><h2>ToolHost 表单提问</h2><details open><summary>第一部分</summary><p>不支持的复合组件使用语义化原生 HTML。</p></details><details><summary>第二部分</summary><p>交互使用普通 JavaScript 和 ARIA。</p></details></section>
```

提交结果必须经过 ToolHost 的显式结果边界，任意 artifact 代码不能冒充该宿主工作流。
