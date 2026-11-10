---
title: 集成
category: Guides
status: ready
order: 25
summary: "在 assistant-ui、Streamdown、Tiptap、Obsidian 或自定义 Markdown 渲染器中接入 slex 代码块。"
slexkitRenderMode: component
---

# 集成

所有适配器都把代码围栏中的原始 HTML 字符串交给 `createSlexKitMarkdownRuntimeHost`，并沿用 `updateArtifact(artifactId, blocks, { phase, reset? })` 的更新生命周期与稳定 ID。

组件注册、`runtimeUrl`、可选 `styleUrl`、能力策略与 artifact 身份都由宿主负责；payload 不导入运行时，也不自行注册元素。frame 资源缺失时必须失败关闭。普通 Markdown 不进入这套执行生命周期。

Streamdown、assistant-ui、Tiptap、Svelte Markdown 与笔记宿主都应使用同一个隔离文档宿主，不能在交付给运行时之前预先执行源码。
