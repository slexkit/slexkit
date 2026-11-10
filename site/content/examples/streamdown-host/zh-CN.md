---
title: "Streamdown 接入"
category: "宿主集成"
status: published
order: 18
summary: "React/Streamdown 适配器示例，在 Markdown 页面中渲染显式 `slex` 代码块。"
tags: streamdown, react, markdown, adapter
components: card, grid, input, slider, stat
difficulty: 中级
runtime: secure
featured: true
slexkitRenderMode: component
---

# Streamdown 接入

Streamdown 继续按常规方式处理普通 Markdown，只把明确的 `slex` fence 字符串交给隔离文档宿主。

```slex
<slex-card title="Streamdown 接入"><slex-grid columns="2"><slex-input id="left" label="数值 A" value="10"></slex-input><slex-slider id="right" label="数值 B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="结果"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

## 宿主边界

适配器识别显式 `slex` fence，并把原始 HTML 字符串交给同一个隔离文档 host。宿主提供稳定 artifact/block ID、runtime URL、style URL 与策略；payload 不包含这些设置。

适配器维护稳定的 artifact/block ID，并把 preview 与 commit 决策交给文档宿主。

`@slexkit/streamdown` 识别显式 fence，并把 HTML source 交给隔离文档 host。

<iframe class="slex-example-live-frame" src="/adapter-demos/streamdown/?embed=1" title="Streamdown HTML fence demo"></iframe>

源码：`examples/streamdown`。
