---
title: "ToolHost 表单提问"
category: "配置向导"
status: published
order: 12
summary: "ToolHost 在对话中渲染表单卡片，收集项目信息并提交结构化结果。"
tags: toolhost, form, ai, conversation
components: toolhost-host
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: dialog
---

# ToolHost 表单提问

ToolHost 在可信宿主侧渲染表单 UI，并返回明确的 submitted 或 ignored 结构化结果；它与只负责展示的 `slex` 执行相互独立。

```js
const handle = renderToolCall({
  id: "project-form",
  name: "fill-form",
  arguments: { fields: [{ name: "name", label: "项目名称", type: "text", required: true }] },
}, container);
const result = await handle.promise;
```

下方表单由宿主运行 ToolHost；提交或忽略后会显示实际返回的结构化结果。
