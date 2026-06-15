---
title: "ToolHost 对话演示"
category: "配置向导"
status: published
order: 13
summary: "展示 SlexKit 的 ToolHost 能力：在 AI 对话流中内嵌交互式表单，收集用户输入后返回结构化 ToolResult。"
tags: toolhost, dialog, demo, live
components: section, card, input, select, submit, callout, code-block, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

## ToolHost 对话演示

AI 对话中需要收集用户信息时，会调用 **ToolHost** 弹出交互式表单卡片。用户填写并提交后，表单数据以结构化的 `ToolResult` 返回给 AI，AI 继续处理。

下方是一个完整的对话演示——模拟用户请求创建项目，AI 调用 `fill-form` 模板收集项目信息，提交后返回 ToolResult。

**流程：** 用户发起请求 → AI 判断需要工具调用 → ToolHost 弹出表单 → 用户填写并提交 → 返回 ToolResult → AI 继续响应

AI 端调用 ToolHost 的代码如下：

```js
import { renderToolCall } from "slexkit/toolhost";

const { promise } = renderToolCall({
  name: "fill-form",
  arguments: {
    title: "创建新项目",
    description: "请填写项目的基本信息。",
    submitLabel: "提交",
    ignoreLabel: "取消",
    fields: [
      { name: "name", label: "项目名称", type: "text", required: true },
      { name: "type", label: "项目类型", type: "select", options: [
        { label: "Web 应用", value: "web" },
        { label: "API 服务", value: "api" },
        { label: "CLI 工具", value: "cli" },
      ]},
      { name: "priority", label: "优先级", type: "select", options: [
        { label: "低", value: "low" },
        { label: "中", value: "medium" },
        { label: "高", value: "high" },
      ]},
    ],
  },
}, container);

// 用户提交后，promise resolve 为 ToolResult
const result = await promise;
// → { toolName: "fill-form", status: "submitted", value: { name, type, priority } }
```
