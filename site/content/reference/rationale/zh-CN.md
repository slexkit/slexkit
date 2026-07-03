---
title: 设计依据
category: Reference
status: ready
order: 80
summary: "SlexKit 为什么使用 object literals、expressions、explicit fences 和 trusted/secure 双运行时。"
slexkitRenderMode: component
---

# 设计依据

SlexKit 为什么使用 JavaScript object literals？为什么允许 expressions？为什么只处理 explicit fences？为什么同时提供 trusted 与 secure runtime？

## 问题空间

SlexKit 用于 chat messages、documents、agent output panels 和 tool dashboards 中的小型交互 UI。它不提供 routing、data layers、build systems，也不是完整 application framework。

这类生成式 UI 的输入格式需要：

- 足够短，适合 token-by-token streaming。
- 可嵌入 Markdown。
- 无需 build step 即可运行。
- Host-agnostic，可在 React、Svelte、Obsidian、vanilla HTML 中工作。

## 为什么使用 JavaScript object literal

Slex source 是一个 object literal：

```js
{
  namespace: "demo",
  g: { count: 0 },
  layout: {
    "button:add": { text: "Add", onclick: "g.count++" },
    "text:value": { "$content": "'计数：' + g.count" }
  }
}
```

模型可以一次性输出这种结构。它不需要项目结构、module imports、build config 或 framework boilerplate。同一份内容可以放在 Markdown fence、Streamdown renderer、Obsidian adapter 或 custom runtime host 中运行。

## 为什么分离 `g` 和 `layout`

`g` 存放 state 和 logic，`layout` 存放 component tree。Expressions 从 `g`、component states 和 `$for` context 读取；event handlers 写回 `g`。

这种分离让模型输出更容易审计：状态和算法集中在一个对象里，UI 结构集中在一棵树里。它也让宿主可以通过 namespace 管理状态生命周期，同 namespace mounts 会共享并合并状态。

## 为什么使用表达式而不是纯 JSON

SlexKit v0 不是 pure JSON protocol。`$` read-pipes 和 `on*` write-pipes 允许 JavaScript expressions 与 statements：

```js
"$content": "'计数：' + g.count"
onclick: "g.count++"
```

这样简单交互更短，也更适合流式生成。Pure JSON 格式需要额外 expression language 或 declarative wiring syntax，会增加 emitter 和 runtime 的复杂度。

代价是必须明确内容是否可信。Trusted 内容可以在 host realm 中低成本执行；untrusted 内容必须进入 secure runtime，也就是 sandbox iframe、opaque origin 和 policy-gated capabilities。

SlexKit 没有通过禁用 expressions 来获得安全性，而是让宿主为每次渲染选择 trusted 或 secure mode。

## 为什么只识别显式 fence

SlexKit hosts 只能处理显式标记的 `slex` fences。Plain JavaScript、JSON 或 untagged code blocks 可能是示例、日志或用户内容，不能被自动执行或渲染。

生成内容应包含普通 Markdown fallback，以便优雅降级：

````md
```slex
{ namespace: "status", layout: { "badge:state": { label: "3/4 complete", tone: "info" } } }
```

**Status:** 3/4 complete
````

支持 SlexKit 的宿主渲染 fence；普通 Markdown 宿主仍能阅读 fallback。

## 展示 UI 与 ToolHost

大多数 AI output 是 display-oriented：status cards、progress indicators、metrics、dashboards。这些走 `slex` fences 或 `mount()`。

ToolHost 只用于必须向宿主返回结构化用户输入的 UI：confirmations、selections、forms。它把 templates 编译为标准 Slex source，`submit` component 负责提交结果。

这个分工避免普通 display UI 被误包装成 function call。

## trusted 与 secure 双运行时

### Trusted runtime

用于 application-generated content、repository Slex source 或已审查 snippets。它的集成成本最低，Slex source 直接在宿主页执行。

### Secure runtime

用于 untrusted 或 agent-generated Slex source。它使用 opaque origin 的 sandbox iframe、CSP 和 locked-down globals。Network、timers、canvas 等敏感能力由 host policy 授权。

宿主为每次 mount 选择 trusted 或 secure；同一份 Slex syntax 可在两种模式下运行。

## 为什么自建响应式系统

SlexKit 提供一个小型 reactive engine，而不是依赖 framework：

- **Runtime core 零 framework dependency**：`@slexkit/runtime` entry 没有外部依赖。
- **Deep tracking**：任意 `g` shape 需要 Proxy-based property access tracking。
- **Scope 足够小**：signal、effect、batch、memo、root/scope 足以支撑这种 fragment UI。

组件层（Svelte）只在使用 `@slexkit/components-svelte` 时引入 `svelte` 依赖。

## 与替代方案的区别

### 与 A2UI 对比

A2UI 是跨平台 declarative message protocol，使用 component catalog 思路。SlexKit v0 更偏 browser-focused、Markdown-friendly，并通过 executable JavaScript expressions 实现交互，而不是 declarative wiring。SlexKit 不声称自己是跨平台 UI standard。

### 与应用框架对比

SlexKit 不是 React/Vue/Svelte 的替代品。它渲染小型交互片段，不做完整应用；没有 router、data fetching layer 或 SSR。

### 与纯 JSON UI 协议对比

SlexKit 用 JSON purity 换取短格式交互表达能力。代价是 explicit trust boundary，这由 sandbox runtime 处理，而不是通过限制 expression language 处理。
