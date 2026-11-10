---
title: 语义化 Details 布局
category: 决策辅助
status: published
order: 13
summary: 没有合适的复合自定义元素时，使用原生 section 与 details 组织内容。
tags: native-html, details, disclosure
components: native-html
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 语义化 Details 布局

该片段使用语义化的原生 `<section>` 与 `<details>` 组成复合展开布局，不需要自定义组件或脚本。

```slex
<section><h2>语义化 Details 布局</h2><details open><summary>第一部分</summary><p>没有对应自定义元素时使用语义化原生 HTML。</p></details><details><summary>第二部分</summary><p>原生展开行为不需要自定义脚本。</p></details></section>
```

原生展开行为只存在于当前 fence 的隔离文档中，不需要隐藏 JavaScript 状态。
