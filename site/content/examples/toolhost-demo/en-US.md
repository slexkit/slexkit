---
title: "ToolHost Tool Call UI"
category: "Tool Rendering"
status: published
order: 13
summary: "Render a function_call as an inline tool card, then write the submitted result back as function_call_output."
tags: toolhost, dialog, demo
components: toolhost, card, radio-group, input, button
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# ToolHost Tool Call UI

When an agent emits a `function_call`, the browser host can render it as an inline ToolHost card; after submission, the host writes `function_call_output` with the original `call_id`, and the trace keeps the receipt visible. Release window, owner, and rollback criteria are only tool arguments here; the page does not call a model or backend.
