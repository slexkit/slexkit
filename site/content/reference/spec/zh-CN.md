---
title: Slex HTML Profile html-1
category: Reference
status: ready
order: 10
summary: "HTML 源码 profile、沙箱 SDK、更新身份、生命周期与静态检查合约。"
slexkitRenderMode: component
---

# Slex HTML Profile html-1

## 源码

源码必须是 HTML 片段字符串，可以包含原生 HTML/SVG、`<style>`、文档列出的 `slex-*` 元素与内联脚本。可执行内联脚本即使省略 `type` 也按模块运行；数据脚本保持惰性。对象输入无效。

公开 profile 标识是 `html-1`，内部 frame 消息通道是 `slexkit-html-v1`；两者都不是旧表达式协议 `0.1`。

## 身份与更新

稳定的 block ID 与元素 `id`/`data-key` 可保留兼容节点、可见控件值、焦点及受支持的选择区。删除节点或改变标签会触发释放；脚本代码变化时先释放旧脚本作用域再替换。reset 会重新应用默认值，任意 closure 状态不保证自动保留。

## SDK

隔离文档提供 `slex.root`、作为作用域 `AbortSignal` 的 `slex.signal`、`slex.onDispose`、`slex.onSnapshot`、`slex.onRestore`、受策略控制的 `slex.api`，以及仅在同一 artifact 内共享 JSON 的 `slex.shared.get/set/subscribe`。每个 fence 仍是独立文档。
