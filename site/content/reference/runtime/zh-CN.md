---
title: 运行时模型
category: Reference
status: ready
order: 30
summary: "HTML 挂载、artifact 更新、隔离生命周期、快照、共享 JSON 状态与静态检查。"
slexkitRenderMode: component
---

# 运行时模型

`mount(source, container, options)` 挂载 HTML 文档宿主，并返回兼具释放函数与 `ready`、`update`、`reset`、`snapshot` 方法的 handle。`createSlexKitMarkdownRuntimeHost` 提供配置、block 挂载/释放以及 artifact 更新/重置操作。

每个 fence 都有独立文档与模块作用域。同一 artifact 下的 fence 可通过 `slex.shared` 交换有界 JSON，但不共享 DOM 或 JavaScript 全局对象。`slex.signal` 是当前模块作用域的 `AbortSignal`。

`inspectSlexSource` 与 `parseSlexSource` 是同一静态检查入口；`validateSlexSource` 为工具返回 diagnostics、warnings 和 errors。它们都不会执行 payload 脚本。`startSlexKitSandboxRunner` 用于启动 frame 内的 guest。
