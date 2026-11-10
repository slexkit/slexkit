---
title: SlexKit Introduction
category: Guides
status: ready
order: 10
summary: "Markdown-friendly reactive UI runtime for explicit slex fences."
slexkitRenderMode: component
---

# SlexKit Introduction

SlexKit is an HTML-first runtime for interactive Markdown. A `slex` fence contains standard HTML/SVG, optional CSS, documented custom elements, and optional inline module scripts. Generated code runs in an isolated frame by default.

```slex
<slex-card title="Counter"><slex-stat id="count" label="Count" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add");
  const click = () => { count.value = Number(count.value) + 1; }; add.addEventListener("click", click);
  slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

There is no object state/layout envelope, expression-string attribute, or legacy fallback. Ordinary Markdown is unchanged.
