---
title: "Release Plan Approval"
category: "Config Wizard"
status: published
order: 13
summary: "ToolHost replays a release-plan flow and collects release parameters at key points."
tags: toolhost, dialog, demo, live
components: toolhost, card, radio-group, input, button
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# Release Plan Approval

The replay walks through a web console release plan. When the flow reaches a human-input point, the page pauses and renders the matching ToolHost card: first the release strategy, then the window, owner, and rollback criteria, and finally the approval decision.

This is a client-side fixture: no model call and no deployment execution. Protocol details are kept in the event log at the bottom.
