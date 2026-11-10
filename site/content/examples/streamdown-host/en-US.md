---
title: "Streamdown Integration"
category: "Host Integration"
status: published
order: 18
summary: "A React/Streamdown adapter that takes over explicit slex fences and leaves ordinary Markdown and code blocks to Streamdown."
tags: streamdown, react, markdown, adapter
components: card, grid, input, slider, stat
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Streamdown Integration

The Streamdown renderer handles ordinary Markdown normally and sends only explicit `slex` fence strings to the isolated document host.

```slex
<slex-card title="Streamdown Integration"><slex-grid columns="2"><slex-input id="left" label="Value A" value="10"></slex-input><slex-slider id="right" label="Value B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="Result"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

## Host boundary

The adapter recognizes explicit `slex` fences and passes the raw HTML string to the same isolated document host. The host supplies stable artifact/block IDs, runtime/style URLs, and policy; the payload does not.

The adapter keeps stable artifact/block IDs and delegates preview versus commit decisions to the document host.

`@slexkit/streamdown` recognizes explicit fences and forwards their HTML source to the isolated document host.

<iframe class="slex-example-live-frame" src="/adapter-demos/streamdown/?embed=1" title="Streamdown HTML fence demo"></iframe>

Source: `examples/streamdown`.
