---
title: 设计依据
category: Reference
status: ready
order: 80
summary: "SlexKit 为什么采用标准 HTML/JavaScript 与隔离文档 lifecycle。"
slexkitRenderMode: component
---

# 设计依据

HTML/SVG、DOM 事件、JavaScript 模块、自定义元素与 slot 已经提供了可移植的创作基础。SlexKit 在这些标准之上增加隔离生命周期、适合流式更新的 commit 语义、组件样式、显式状态传递和策略桥接，而不再发明一套绑定语言。
