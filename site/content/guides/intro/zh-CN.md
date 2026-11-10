---
title: SlexKit 简介
category: Guides
status: ready
order: 10
summary: "面向 Markdown 的响应式 UI 运行时，用于渲染显式 slex 代码围栏。"
slexkitRenderMode: component
---

# SlexKit 简介

SlexKit 是面向交互式 Markdown 的 HTML-first 运行时。`slex` 代码围栏可以包含标准 HTML/SVG、可选 CSS、文档列出的自定义元素，以及可选的内联模块脚本。生成代码在独立的隔离 frame 中运行。

```slex
<slex-card title="Counter"><slex-stat id="count" label="Count" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add");
  const click = () => { count.value = Number(count.value) + 1; }; add.addEventListener("click", click);
  slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

当前格式没有对象式 state/layout 外壳、表达式字符串属性或旧格式回退；围栏以外的普通 Markdown 行为不变。
