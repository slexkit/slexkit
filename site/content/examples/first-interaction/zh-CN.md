---
title: "第一个交互：按钮计数器"
category: "入门教程"
status: published
order: 2
summary: "通过原生 click 事件与实时组件 property，让按钮更新指标值。"
tags: beginner, native-events, button
components: button, card, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 第一个交互：按钮计数器

原生 click 监听器更新指标组件的实时 `.value` property，并在脚本作用域释放时完成清理。

```slex
<slex-card title="第一个交互：按钮计数器"><slex-stat id="count" label="次数" value="0"></slex-stat><slex-button id="add" label="增加"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add"); const click = () => { count.value = Number(count.value) + 1; };
  add.addEventListener("click", click); slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

稳定元素 ID 让兼容 commit 保留按钮和指标实例；脚本变化时仍会干净地替换模块作用域。
