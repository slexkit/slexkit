---
title: "ToolHost Form Question"
category: "Config Wizard"
status: published
order: 12
summary: "ToolHost renders a form card during a conversation, collects project fields, and submits structured results."
tags: toolhost, form, ai, conversation
components: native-html
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# ToolHost Form Question

ToolHost renders trusted host-side form UI and resolves an explicit submitted or ignored structured result; it is separate from display-only `slex` execution.

```slex
<section><h2>ToolHost Form Question</h2><details open><summary>First section</summary><p>Unsupported compound widgets use semantic native HTML.</p></details><details><summary>Second section</summary><p>Interaction uses ordinary JavaScript and ARIA.</p></details></section>
```

Submission crosses ToolHost's explicit result boundary; arbitrary artifact code cannot impersonate this host workflow.
