---
title: SlexKit 简介
category: Guides
status: ready
order: 10
summary: "面向 Markdown 的响应式 UI 运行时，用于渲染显式 slex 代码围栏。"
slexkitRenderMode: component
---

# SlexKit 简介

SlexKit 把 Markdown 中显式标记为 `slex` 的代码围栏渲染成小型交互 UI。它适合聊天消息、文档、agent 面板和仪表盘里的局部交互，不需要为这些片段单独加构建步骤。

SlexKit 目前处于 v0/beta 阶段。公开能力已经可用，但长期兼容性还没有稳定承诺。

## 什么时候使用

当 Markdown 需要少量交互时：

- 状态卡片、计数器、计算器、参数面板、轻量仪表盘
- 需要保留 Markdown 降级文本的 AI 生成 UI 片段
- React、Svelte、Obsidian 或原生 HTML 宿主渲染同一段 fenced source

SlexKit 不是完整应用框架。它不提供路由、服务端渲染、数据获取层，也不是跨平台纯 JSON UI 标准。

## 源码格式

Slex source 是 JavaScript 对象字面量，状态放在 `g`，组件树放在 `layout`：

```slex
{
  namespace: "intro_counter",
  g: {
    count: 0
  },
  layout: {
    "card:counter": {
      title: "计数器",
      "text:value": {
        "$text": "'计数：' + g.count"
      },
      "button:add": {
        label: "+1",
        onclick: "g.count++"
      }
    }
  }
}
```

- `namespace` 标识状态域
- `g` 存放响应式状态、函数和小型计算逻辑
- `layout` 存放组件节点，节点键使用 `type:name` 格式
- `$` 前缀属性是读表达式，例如 `"$text": "'计数：' + g.count"`
- `on*` 属性是写表达式，例如 `onclick: "g.count++"`

运行时也接受裸组件树作为简写，但公开文档和共享示例优先使用完整 envelope。

## 围栏约定

宿主仅处理显式标记为 `slex` 的代码围栏：

````markdown
```slex
{
  namespace: "status",
  layout: {
    "badge:state": { label: "就绪", tone: "success" }
  }
}
```

**状态：** 就绪
````

围栏后的 Markdown 是降级输出。普通 Markdown 阅读器会显示降级文本；支持 SlexKit 的宿主会将围栏替换为交互式 UI。

普通 JavaScript、JSON 或未标记代码块不应被扫描或执行。

## 运行模式

**可信模式（Trusted mode）** 在宿主页内执行 Slex source，用于应用生成内容、本地文档和仓库示例。

**安全模式（Secure mode）** 在 sandbox iframe 中执行不可信或 agent 生成的 source。网络、定时器、动画、canvas 等敏感能力仅通过宿主 policy 和 `api.*` 暴露。

渲染第三方或未经审查内容时应使用 secure mode。详见 [安全运行时接入](security-runtime)。

## 展示 UI 与工具调用

**展示 UI** 通过 `slex` 代码围栏或 `mount()` 渲染，负责展示信息和局部交互，但不是函数调用。

**ToolHost** 用于必须把结构化输入返回给宿主的确认、选项选择和表单。`submit` 组件用于结束一个工具模板并提交结果。

这种分离可以避免普通展示 UI 被误包装成工具调用。

## 核心接口

| API | 用途 |
|---|---|
| `mount(input, container, options?)` | 将可信 Slex source 渲染到容器 |
| `ingest(input)` | 合并 state-only source，不渲染 UI |
| `boot(options?)` | 增强静态页面中的 `slex` 代码围栏 |
| `createSlexKitMarkdownRuntimeHost(options?)` | Markdown 宿主入口 |
| `mountSecureArtifact(input, container, options)` | 使用安全沙箱运行时渲染 source |
| `renderToolCall(call, container)` | 渲染 ToolHost 模板并收集结果 |

类型细节和 beta 兼容说明见 [Slex Specification](/zh-CN/docs/reference/spec)。

## 继续阅读

- [开始使用](quick-start)：开发者首次集成路径
- [集成](integration)：Streamdown 和 Obsidian 宿主插件
- [设计规范](design)：公开示例和组件使用规范
- [安全运行时接入](security-runtime)：不可信内容渲染
- [组件文档](../components/card)：内置组件目录
- [AI / Agents](ai-agents)：模型和 agent 的 SlexKit 上下文
