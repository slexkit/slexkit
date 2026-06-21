---
title: "发布计划确认"
category: "配置向导"
status: published
order: 13
summary: "用静态 Responses-style 回放展示 AI 生成发布计划时如何通过 ToolHost 收集用户决策。"
tags: toolhost, dialog, demo, live
components: section, card, input, select, checkbox, submit, callout, code-block, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# 发布计划确认

这个页面使用静态样例数据模拟 OpenAI Responses 风格的输出流：用户让 AI 准备一次 Web 控制台发布计划，AI 在需要人确认的位置发起 `function_call`，页面暂停并把调用映射到 SlexKit 的 **ToolHost**。

用户在 ToolHost 中选择发布策略、补充发布窗口与回滚条件、确认采用计划后，示例会生成一条 `function_call_output`，再继续回放后续消息。整个演示是纯前端的，不连接真实模型，不触发真实发布，也不会暴露 API key。

**流程：** 发布目标 → `function_call` → ToolHost 暂停 → 用户提交或忽略 → `function_call_output` → 发布摘要
