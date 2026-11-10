---
title: "ToolHost Tool Call UI"
category: "Tool Rendering"
status: published
order: 13
summary: "Render a function_call as an inline tool card, then write the submitted result back as function_call_output."
tags: toolhost, dialog, demo
components: toolhost-host
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: dialog
---

# ToolHost Tool Call UI

ToolHost is a host-side tool-call renderer, not an authoring element inside a `slex` payload. The host selects a registered template from a trusted `function_call` name and passes only the call arguments to that template.

```js
const handle = renderToolCall({
  name: "fill-form",
  id: item.call_id,
  arguments: JSON.parse(item.arguments),
}, container);
const output = await handle.promise;
responsesInput.push({ type: "function_call_output", call_id: item.call_id, output: JSON.stringify(output) });
```

## Tool-call boundary

When an agent emits a `function_call`, the browser host can render it as an inline ToolHost card. The returned handle's promise resolves after submit or ignore, then the host writes a `function_call_output` using the original call ID. This workflow does not execute a deployment or other domain action by itself.
