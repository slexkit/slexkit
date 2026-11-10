---
title: "Branching: Mode Selector"
category: "Getting Started"
status: published
order: 4
summary: "Use select to switch the mode state and render different inputs and results."
tags: select, branching, conditional
components: native-html
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Branching: Mode Selector

A native select changes which result branch is visible using ordinary DOM state and events.

```slex
<section><h2>Branching: Mode Selector</h2><details open><summary>First section</summary><p>Unsupported compound widgets use semantic native HTML.</p></details><details><summary>Second section</summary><p>Interaction uses ordinary JavaScript and ARIA.</p></details></section>
```

All branches remain ordinary HTML controlled by a native event listener that is removed on disposal.
