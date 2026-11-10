---
title: "assistant-ui 接入"
category: "宿主集成"
status: published
order: 17
summary: "在 assistant-ui 的 Streamdown text message parts 中渲染显式 slex fences。"
tags: assistant-ui, react, streamdown, markdown, adapter
components: card, grid, input, slider, stat
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# assistant-ui 接入

本页说明 assistant-ui 的 Streamdown 文本包装器如何识别明确的 `slex` fence，并把其中的 HTML 字符串交给共享的隔离文档宿主。

```slex
<slex-card title="assistant-ui 接入"><slex-grid columns="2"><slex-input id="left" label="数值 A" value="10"></slex-input><slex-slider id="right" label="数值 B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="结果"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

## 宿主边界

适配器识别显式 `slex` fence，并把原始 HTML 字符串交给同一个隔离文档 host。宿主提供稳定 artifact/block ID、runtime URL、style URL 与策略；payload 不包含这些设置。

适配器负责 artifact/block 身份与运行时资源 URL；fence payload 不注册元素，也不导入运行时。

`@slexkit/assistant-ui` 提供用于 assistant-ui text part 的 `SlexKitAssistantStreamdownText`；tool call 仍由单独的宿主集成处理。

<iframe class="slex-example-live-frame" src="/adapter-demos/assistant-ui/?embed=1" title="assistant-ui HTML fence demo"></iframe>

源码：`examples/assistant-ui`。
