---
title: "Tiptap 编辑器接入"
category: "宿主集成"
status: published
order: 19
summary: "Tiptap CodeBlock 适配器：只把显式 slex 代码块渲染为预览，普通代码块和 Markdown 导入/导出保持 Tiptap 行为。"
tags: tiptap, editor, markdown, adapter
components: card, grid, input, slider, stat
difficulty: 中级
runtime: secure
featured: true
slexkitRenderMode: component
---

# Tiptap 编辑器接入

Tiptap 扩展保留代码块编辑与 Markdown 往返转换，同时把明确的 `slex` 预览执行交给隔离宿主。

```slex
<slex-card title="Tiptap 编辑器接入"><slex-grid columns="2"><slex-input id="left" label="数值 A" value="10"></slex-input><slex-slider id="right" label="数值 B" min="0" max="100" value="20"></slex-slider></slex-grid><slex-stat id="result" label="结果"></slex-stat></slex-card>
<script type="module">
  const left = slex.root.querySelector("#left"); const right = slex.root.querySelector("#right"); const result = slex.root.querySelector("#result"); const update = () => { result.value = Number(left.value) + right.valueAsNumber; };
  left.addEventListener("input", update); right.addEventListener("input", update); update(); slex.onDispose(() => { left.removeEventListener("input", update); right.removeEventListener("input", update); });
</script>
```

## 宿主边界

适配器识别显式 `slex` fence，并把原始 HTML 字符串交给同一个隔离文档 host。宿主提供稳定 artifact/block ID、runtime URL、style URL 与策略；payload 不包含这些设置。

编辑中的不完整源码只做静态检查，同时 node view 会让上一次 commit 的预览继续可交互。

`@slexkit/tiptap` 保留 Markdown round-trip，同时由 node view 把 HTML 执行委托给隔离文档 host。

<iframe class="slex-example-live-frame" src="/adapter-demos/tiptap/?embed=1" title="Tiptap HTML fence demo"></iframe>

源码：`examples/tiptap`。
