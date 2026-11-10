---
title: Design Philosophy
category: Guides
status: ready
order: 30
summary: "Design principles for live Markdown, components, and agent-generated UI."
includeTitleInToc: true
slexkitRenderMode: component
---

# Design Philosophy

Prefer semantic native HTML first and use only custom elements present in `dist/custom-elements.json`. Use scalar attributes for initial values, live JavaScript properties for arrays/objects, native events for interaction, and slots for children.

Keep algorithms in ordinary JavaScript. Give durable nodes stable `id` or `data-key` values. Register listener/timer/observer cleanup with `slex.onDispose`. Use `slex.onSnapshot`/`slex.onRestore` only when hidden state explicitly needs persistence. Do not invent a binding language.
