---
title: "ToolHost 工具调用 UI"
category: "工具调用渲染"
status: published
order: 13
summary: "把 function_call 渲染成对话内工具卡片，再把提交结果写回 function_call_output。"
tags: toolhost, dialog, demo
components: toolhost, card, radio-group, input, button
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# ToolHost 工具调用 UI

当 Agent 发起 `function_call` 时，浏览器宿主可以把它渲染成对话里的 ToolHost 工具卡片；用户提交后，宿主按原 `call_id` 写回 `function_call_output`，并把结果记录留在轨迹里。本页只用发布窗口、负责人和回滚条件作为工具参数示例，不连接模型或后端。
