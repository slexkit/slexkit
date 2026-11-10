---
title: "Tiptap Editor Integration"
category: "Host Integration"
status: published
order: 19
summary: "A Tiptap CodeBlock adapter that previews explicit slex blocks while preserving ordinary code blocks and Markdown import/export."
tags: tiptap, editor, markdown, adapter
components: card, grid, input, slider, stat
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Tiptap Editor Integration

The Tiptap extension preserves code-block editing and Markdown round-tripping while delegating explicit `slex` preview execution to the isolated host.

```slex
<slex-card title="Tiptap Editor Integration"><slex-grid columns="2"><slex-input id="left" label="Value A" value="10"></slex-input><slex-slider id="right" label="Value B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="Result"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

## Host boundary

The adapter recognizes explicit `slex` fences and passes the raw HTML string to the same isolated document host. The host supplies stable artifact/block IDs, runtime/style URLs, and policy; the payload does not.

The node view keeps the last committed preview interactive while incomplete edits are inspected without execution.

`@slexkit/tiptap` keeps Markdown round-tripping while the node view delegates HTML execution to the isolated document host.

<iframe class="slex-example-live-frame" src="/adapter-demos/tiptap/?embed=1" title="Tiptap HTML fence demo"></iframe>

Source: `examples/tiptap`.
