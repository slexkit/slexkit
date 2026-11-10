---
title: 设计哲学
category: Guides
status: ready
order: 30
summary: "动态 Markdown、组件和 agent 生成 UI 的设计原则。"
includeTitleInToc: true
slexkitRenderMode: component
---

# 设计哲学

优先采用有语义的原生 HTML，只使用 `dist/custom-elements.json` 中确实存在的自定义元素。标量初值写在 attribute 中，数组和对象通过可实时更新的 JavaScript property 传入，交互采用原生事件，子内容通过 slot 组合。

算法应写成普通 JavaScript。需要跨兼容更新保留的节点应设置稳定的 `id` 或 `data-key`。监听器、定时器和观察器等副作用通过 `slex.onDispose` 清理；只有隐藏状态确实需要延续时，才使用 `slex.onSnapshot`/`slex.onRestore`。不要另造绑定语言。
