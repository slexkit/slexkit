---
title: "Release Plan Approval"
category: "Config Wizard"
status: published
order: 13
summary: "Static Responses-style replay for ToolHost release-plan decisions."
tags: toolhost, dialog, demo, live
components: section, card, input, select, checkbox, submit, callout, code-block, grid, column
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# Release Plan Approval

A static fixture simulates an OpenAI Responses-style output stream. When the release-plan flow reaches a human decision point, the replay pauses and maps the corresponding `function_call` into SlexKit **ToolHost**.

After the release strategy, constraints, or approval decision are submitted through ToolHost, the demo appends a `function_call_output` item and continues replaying later messages. It is fully client-side: no live model call, no real deployment, no backend dependency, and no exposed API key.

**Flow:** release request → `function_call` → ToolHost pause → submit or ignore → `function_call_output` → release summary
