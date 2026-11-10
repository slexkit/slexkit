---
title: "First SlexKit Card"
category: "Getting Started"
status: published
order: 1
summary: "A static card with text and badge custom elements; no script is required."
tags: beginner, static, overview
components: badge, card, text
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# First SlexKit Card

This static fragment combines documented custom elements and slots without requiring a script.

```slex
<slex-card title="First SlexKit Card"><slex-text text="This is a standard HTML fence."></slex-text><slex-badge text="HTML-first" tone="success"></slex-badge></slex-card>
```

Because the fragment has no hidden JavaScript state, compatible updates rely only on stable DOM identity and component properties.
