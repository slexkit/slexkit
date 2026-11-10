---
title: Semantic Details Layout
category: Decision Support
status: published
order: 13
summary: Use native section and details elements when no documented compound custom element matches the content.
tags: native-html, details, disclosure
components: native-html
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Semantic Details Layout

This fragment uses semantic native `<section>` and `<details>` elements for a compound disclosure layout that needs no custom component or script.

```slex
<section><h2>Semantic Details Layout</h2><details open><summary>First section</summary><p>Unsupported compound widgets use semantic native HTML.</p></details><details><summary>Second section</summary><p>Native disclosure behavior needs no custom script.</p></details></section>
```

Native disclosure behavior remains inside this fence's isolated document and requires no hidden JavaScript state.
