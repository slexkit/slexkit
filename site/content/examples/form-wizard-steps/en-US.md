---
title: "ToolHost Form Question"
category: "Config Wizard"
status: published
order: 12
summary: "ToolHost renders a form card during a conversation, collects project fields, and submits structured results."
tags: toolhost, form, ai, conversation
components: toolhost-host
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: dialog
---

# ToolHost Form Question

ToolHost renders trusted host-side form UI and resolves an explicit submitted or ignored structured result; it is separate from display-only `slex` execution.

```js
const handle = renderToolCall({
  id: "project-form",
  name: "fill-form",
  arguments: { fields: [{ name: "name", label: "Project name", type: "text", required: true }] },
}, container);
const result = await handle.promise;
```

The form below is rendered by ToolHost in the host. Submit or ignore it to see the returned structured result.
