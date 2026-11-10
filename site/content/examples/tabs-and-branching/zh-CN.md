---
title: "分支与切换：模式选择器"
category: "入门教程"
status: published
order: 4
summary: "用 select 切换 mode 状态，并根据当前模式渲染不同输入和结果。"
tags: select, branching, conditional
components: native-html
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 分支与切换：模式选择器

原生 select 通过普通 DOM 状态与事件切换当前显示的结果分支。

```slex
<section><h2>分支与切换：模式选择器</h2><details open><summary>第一部分</summary><p>不支持的复合组件使用语义化原生 HTML。</p></details><details><summary>第二部分</summary><p>交互使用普通 JavaScript 和 ARIA。</p></details></section>
```

所有分支都是普通 HTML，由原生事件监听器控制，并在释放时移除监听器。
