---
title: "assistant-ui Integration"
category: "Host Integration"
status: published
order: 17
summary: "assistant-ui adapter for rendering explicit slex fences inside Streamdown text message parts."
tags: assistant-ui, react, streamdown, markdown, adapter
components: card, grid, input, slider, stat
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# assistant-ui Integration

This page shows how assistant-ui's Streamdown text wrapper detects an explicit `slex` fence and forwards its HTML string to the shared isolated document host.

```slex
<slex-card title="assistant-ui Integration"><slex-grid columns="2"><slex-input id="left" label="Value A" value="10"></slex-input><slex-slider id="right" label="Value B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="Result"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

## Host boundary

The adapter recognizes explicit `slex` fences and passes the raw HTML string to the same isolated document host. The host supplies stable artifact/block IDs, runtime/style URLs, and policy; the payload does not.

The adapter owns artifact/block identity and runtime asset URLs; fence payloads neither register elements nor import the runtime.

`@slexkit/assistant-ui` supplies `SlexKitAssistantStreamdownText` for assistant-ui text parts. Tool calls remain a separate host integration.

<iframe class="slex-example-live-frame" src="/adapter-demos/assistant-ui/?embed=1" title="assistant-ui HTML fence demo"></iframe>

Source: `examples/assistant-ui`.
