---
title: "ToolHost 工具调用 UI"
category: "工具调用渲染"
status: published
order: 13
summary: "把 function_call 渲染成对话内工具卡片，再把提交结果写回 function_call_output。"
tags: toolhost, dialog, demo
components: toolhost-host
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: dialog
---

# ToolHost 工具调用 UI

ToolHost 是宿主侧的工具调用渲染器，不是 `slex` payload 内的创作元素。宿主根据可信的 `function_call` 名称选择已注册模板，只把调用参数传入模板。

```js
const handle = renderToolCall({
  name: "fill-form",
  id: item.call_id,
  arguments: JSON.parse(item.arguments),
}, container);
const output = await handle.promise;
responsesInput.push({ type: "function_call_output", call_id: item.call_id, output: JSON.stringify(output) });
```

## Tool-call 边界

Agent 产生 `function_call` 时，浏览器宿主可以把它渲染成对话内的 ToolHost 工具卡片。返回句柄的 promise 在提交或忽略后结束，随后宿主使用原始 call ID 写回 `function_call_output`。该流程本身不会执行发布或其他领域操作。
