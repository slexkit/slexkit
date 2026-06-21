---
title: "Release Plan Approval"
category: "Config Wizard"
status: published
order: 13
summary: "A static Responses-style replay showing how ToolHost collects user decisions while AI drafts a release plan."
tags: toolhost, dialog, demo, live
components: section, card, input, select, checkbox, submit, callout, code-block, grid, column
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# Release Plan Approval

This page uses a static fixture to simulate an OpenAI Responses-style output stream. The user asks AI to prepare a web console release plan; when a human decision is needed, the replay pauses and maps the `function_call` into SlexKit **ToolHost**.

After the user chooses a release strategy, adds release constraints, or approves the plan through ToolHost, the demo appends a `function_call_output` item and continues replaying later messages. It is fully client-side: no live model call, no real deployment, no backend dependency, and no exposed API key.

**Flow:** release request → `function_call` → ToolHost pause → submit or ignore → `function_call_output` → release summary
