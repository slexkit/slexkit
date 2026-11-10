---
title: 宿主集成
category: Reference
status: ready
order: 40
summary: "Streamdown、assistant-ui、Tiptap、笔记宿主与自定义适配器的 HTML 文档宿主接入。"
slexkitRenderMode: component
---

# 宿主集成

所有适配器都把代码围栏中的原始 HTML 字符串交给 `createSlexKitMarkdownRuntimeHost`，并保留 `updateArtifact(artifactId, blocks, { phase, reset? })` 的更新生命周期与稳定 ID。

组件注册、`runtimeUrl`、可选 `styleUrl`、能力策略与 artifact 身份由宿主管理。payload 不导入运行时，也不注册元素；frame 资源缺失时失败关闭。普通 Markdown 不进入该生命周期。

`mode: "trusted"` 与 `trusted: true` 只作为兼容配置被接受；`getMode()` 返回 `"secure"`，payload 始终在隔离文档中执行。Streamdown、assistant-ui、Tiptap、Svelte Markdown 与笔记宿主都应复用这一路径，不能预执行源码。
