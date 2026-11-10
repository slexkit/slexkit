---
title: 图标系统
category: Reference
status: ready
order: 90
summary: "Phosphor icons、自定义 icon 注册、Iconify fallback 与组件 icon 用法。"
slexkitRenderMode: component
---

# 图标系统

图标解析与注册由宿主和组件负责。payload 可以使用内联 SVG，或给组件文档列出的标量 `icon` property 赋值；不要在生成源码中导入图标库，也不要注入外部 SVG URL。内联 SVG 同样受静态 URL 与元素策略约束。
