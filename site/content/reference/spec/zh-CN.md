---
title: Slex 规范 v0.1
category: Reference
status: ready
order: 10
summary: "公开 Slex expression envelope、component keys、props、directives、lifecycle 与 runtime API contract。"
slexkitRenderMode: component
---

# Slex 规范 v0.1

Slex expression envelope、component keys、props、directives、lifecycle、runtime API contract——SlexKit v0 的公开协议全在这里。implementors、test authors、host adapter authors 以本文为最终依据。

v0/beta 阶段：当前实现可能调整，但协议版本（v0.1）独立于包版本。同一协议版本可能跨越多个包版本保持兼容。

## 1. Slex expression envelope

标准 Slex expression 是 JavaScript object literal：

```js
{
  slex: "0.1",
  namespace: "example",
  g: {},
  layout: {}
}
```

字段含义：

- `slex`：可选 protocol marker，当前值为 `"0.1"`。
- `namespace`：状态域。省略时默认 `"default"`。
- `g`：全局响应式状态和函数。
- `layout`：组件树。

运行时也接受裸组件树：当 object keys 看起来是组件 key（包含 `:`）时，会归一化为默认 envelope。

## 2. Layout key

组件节点使用 `type:name` key：

```js
{
  "card:summary": {
    "text:title": { text: "Ready" }
  }
}
```

- `type` 用于查找 renderer。
- `name` 用于 component instance state、lifecycle hooks 和表达式上下文。
- 同一 namespace 下相同 `type:name` 代表同一命名组件 state。

保留上下文名称：`g`、`api`、`$event`、`$item`、`$index`、`$key`。

## 3. Props classification

### Static props

普通 props 原样传给组件：

```js
"badge:state": { label: "Ready", tone: "success" }
```

### `$` read-pipes

`$` 前缀 prop（排除 `$if`、`$for`、`$key`）表示动态 read expression。Runtime 求值后去掉 `$` 前缀并传给组件：

```js
"text:value": { "$content": "'Count: ' + g.count" }
// 解析为: content = "Count: <g.count 的值>"
```

表达式读取 `g`、命名组件 state 或 `$for` context 后，会建立依赖；依赖变化时重新求值。

### `on*` write-pipes

`on*` 前缀 prop 表示事件 handler statement：

```js
"button:add": { onclick: "g.count++" }
```

Handler 可访问 `$event`。Writable components 会在 handler 执行前同步自身 state。

### Structural directives

`$if`、`$for`、`$key` 是 structural directives，不作为 props 传给 renderer。

## 4. `g` merge

同一 namespace 的多次 mount 或 ingest 会合并 `g`：

| 值类型 | 合并行为 |
|-------------------|------------------|
| Function | 覆盖旧值 |
| Array | 整体替换 |
| Plain object | 递归深层合并 |
| 其他 scalar | 覆盖旧值 |
| 新 `g` 中不存在的 key | 保留旧值 |

`layout` 不做 deep merge；新 layout 替换旧 layout。

## 5. Expression context

表达式可以访问：

| Variable | Type | Scope |
|---|---|---|
| `g` | 响应式 state proxy | 始终可用 |
| Component state | 如 `slider.value` | 命名组件 |
| `api` | 宿主注入对象 | 存在 `api` option 时 |
| `$event` | 事件数据 | `on*` handler |
| `$item` | 当前数组项 | `$for` context |
| `$index` | 当前数组索引 | `$for` context |
| `$key` | 当前项 key | `$for` context |
| 命名 `$for` 别名 | 如 `"card:user"` 可用 `user` | `$for` context |

Trusted mode 使用 `new Function()` 求值。Secure mode 在 sandbox iframe 内求值，并通过 policy-gated `api.*` 暴露能力。

表达式求值错误会被捕获，产生包含 namespace 和路径信息的 warning。回退返回上一个已知值。

## 6. Component instance state

Renderer 注册时声明 state mode：

| Mode | Writable props | Notes |
|---|---|---|
| `value` | `value` | 常见文本、输入、slider |
| `checked` | `checked`, `value` | checkbox 等勾选型布尔组件 |
| `enabled` | `enabled` | switch 等启用型布尔组件 |
| `readable` | 无 | 可读但不可写 |
| `none` | 无 | 不暴露 instance state |

命名组件 state 可在表达式中通过组件 name 访问：

```js
{
  layout: {
    "slider:threshold": { value: 50 },
    "text:label": { "$content": "'Threshold: ' + threshold.value" }
  }
}
```

`type: "engineering"` 的 `input` 是 value-mode 组件，额外暴露解析字段。`value` 保留原始输入字符串，`number`、`valid`、`prefix`、`unit`、`normalized` 和可选 `error` 暴露解析后的工程数值。支持科学计数法和 SI 前缀（`p`、`n`、`u`、`µ`、`m`、`k`、`K`、`M`、`meg`、`G`、`T`）加单位后缀。单位只做捕获，不做物理维度换算。

## 7. `$if`

`$if` 控制节点是否渲染：

```js
"card:details": {
  "$if": "g.open",
  "text:body": { text: "Details" }
}
```

- **Truthy** — mount 组件及其子树，若定义了 `$enter` 则播放进入动画。
- **Falsy** — unmount 组件及子树，若定义了 `$leave` 则播放离开动画，然后触发 lifecycle hooks、disposers 和子树 cleanup。

## 8. `$for`

`$for` 为数组生成重复节点：

```js
"text:item": {
  "$for": "g.items",
  "$key": "id",
  "$content": "$item.label"
}
```

### `$key` strategy

- `"$value"`：primitive item 使用自身作为 key。
- `"id"`：object item 使用属性作为 key。
- 省略：优先 `item.id`，否则 index fallback，并输出 warning。

Primitive arrays 应使用 `$key: "$value"`。

### `$for` phases

1. **Delete**：移除不存在的 keys。
2. **Add/update/reorder**：创建新 nodes，更新保留 nodes 的 item/index context，并重排 DOM。
3. **Trim**：移除防御性多余 children。

Item index 或 item reference 变化时调用 `onUpdate_<name>`。

## 9. Lifecycle and cleanup

Runtime 按命名约定调用 hooks：

```txt
g.onMount_<name>()      -after component is appended to DOM
g.onUnmount_<name>()    -before component is removed from DOM
g.onUpdate_<name>()     -after $for item changes
```

组件 renderer 可使用 `attachComponentDisposer(el, fn)` 注册 cleanup。Runtime 在节点移除、`$if` 关闭、`$for` 项删除、root cleanup 或 `disposeNamespace()` 时调用 disposer。

## 10. Public runtime API

| Function | Signature | Description |
|---|---|---|
| `mount` | `(input, container, options?) => Cleanup` | 解析、合并 state、渲染组件树 |
| `ingest` | `(input) => boolean` | 仅合并 state，不渲染 |
| `boot` | `(options?) => void` | 增强静态页面的 `language-slex` blocks |
| `disposeNamespace` | `(namespace) => void` | 释放 namespace roots、store 和 cache |
| `register` | `(type, renderer, options?) => void` | 注册组件类型 |
| `getRenderer` | `(type) => ComponentRenderer \| undefined` | 查询已注册的 renderer |
| `getIcon` | `(name, state?) => string` | 同步解析注册或内置图标 |
| `loadIcon` | `(name, state?) => Promise<string>` | 解析图标，未打包时使用 Iconify fallback |
| `registerIcon` | `(name, svg, options?) => void` | 为所有支持 `icon` 字段的组件注册一个全局 SVG 图标 |
| `registerIcons` | `(icons, options?) => void` | 注册多个全局 SVG 图标 |
| `clearRegisteredIcons` | `() => void` | 清除所有自定义注册图标 |
| `getRegisteredIcon` | `(name, state?) => string` | 仅查注册图标（无 Phosphor fallback） |
| `normalizeIconName` | `(name) => string` | 将图标名归一化为 kebab-case 加集合前缀 |
| `resolveIconWeight` | `(state?) => IconWeight` | 从组件状态解析图标 weight |
| `resolveIconifyIcon` | `(name, state?) => {prefix, name}` | 解析为 Iconify 兼容的 name pair |
| `iconifySvgUrl` | `(name, state?) => string` | 构建完整 Iconify API SVG URL |
| `configureComponentScope` | `(options) => void` | 配置框架 adapter flush |
| `attachComponentDisposer` | `(el, dispose) => void` | 绑定 cleanup 到元素生命周期 |
| `createSecureRuntime` | `(policy, adapter?) => SecureRuntimeHandle` | 创建 policy-gated runtime 实例 |
| `mountSecureArtifact` | `(input, container, options) => Cleanup` | 在 secure sandbox 中挂载 |
| `createSlexKitMarkdownRuntimeHost` | `(options?) => MarkdownRuntimeHost` | 创建 Markdown host 实例 |
| `getSlexKitMarkdownRuntimeHost` | `() => MarkdownRuntimeHost` | 获取或创建全局 Markdown host |
| `installSlexKitMarkdownRuntimeHost` | `(options?) => MarkdownRuntimeHost` | 安装并返回全局 Markdown host |
| `getSlexKitRuntimeUrl` | `() => string \| undefined` | 获取默认 sandbox runtime URL |
| `setSlexKitRuntimeUrl` | `(url) => void` | 设置默认 sandbox runtime URL |
| `diagnoseSlexKitSource` | `(source, error) => Diagnostic` | 定位源码中的语法错误 |
| `parseSlexSource` | `(source) => ParseResult` | 将 Slex source 解析为对象 |
| `formatSlexKitDiagnostic` | `(diagnostic) => string` | 将 diagnostic 格式化为可读字符串 |

完整 runtime 行为见 [Runtime Model](/docs/reference/runtime)。

## 11. Error types

### `SlexKitSyntaxError`

当 Slex source 解析失败时抛出。包含 `diagnostic` 属性，其中包含 `message`、`line`、`column`、`detail` 和 `excerpt`。

### `SlexKitRuntimeError`

当 runtime 操作违反 policy 或遇到运行时失败时抛出。属性：`kind`（`"policy"` | `"network"` | `"timeout"`）、`code`（特定错误码字符串）、`message`、`elapsedMs`。

Diagnostics API：

```ts
diagnoseSlexKitSource(source)
formatSlexKitDiagnostic(diagnostic)
```

## 12. Markdown language handling

Markdown hosts 只能处理明确标记为 `slex` 的 fenced code blocks。

不得自动执行：

- `js`
- `javascript`
- `json`
- untagged fences
- inline code

Host 应保留普通 Markdown fallback，以便不支持 SlexKit 的环境可读。

## 13. Secure runtime types

```ts
type SecureRuntimeHandle = {
  api: SlexKitRuntimeApi;
  dispose: () => void;
};
```

完整类型（`HostRuntimePolicy`、`HostRuntimeAdapter`、`SlexKitRuntimeApi`、`SecureFrameOptions`、`SecureMountOptions`、sandbox message types）见 [security runtime contract](/docs/reference/security)。

## 14. ToolHost

ToolHost 把 AI tool calls 连接到返回结构化用户输入的交互 UI。它与 display-oriented `slex` fences 分离。

**Public API：**

| Function | Signature | Description |
|---|---|---|
| `renderToolCall` | `(call, container) => ToolRenderHandle` | 编译并挂载 tool UI，返回 promise |
| `registerToolTemplate` | `(name, compiler) => void` | 注册自定义 tool template 编译器 |

**Result 类型：**

```ts
type ToolResult =
  | { toolCallId?: string; toolName: string; status: "submitted"; value: Record<string, unknown> }
  | { toolCallId?: string; toolName: string; status: "ignored"; value: null };
```

**内置 templates：** `confirm-action`、`choose-options`、`option-list`、`fill-form`。Templates 编译成标准 Slex expression，使用 `card:tool` 和 `submit:actions` 组件。`submit:actions` 是 completion boundary——仅由 tool template 使用，不作为普通 display fence。

完整 template reference 和自定义 template 开发见 [ToolHost documentation](/docs/reference/toolhost)。

## 15. Icon system

Icon system 提供：

- `registerIcon`
- `registerIcons`
- `clearRegisteredIcons`
- `getIcon`
- `getRegisteredIcon`
- `loadIcon`
- `normalizeIconName`
- `resolveIconWeight`
- `resolveIconifyIcon`
- `iconifySvgUrl`

组件使用 kebab-case icon names。完整 API、icon list、命名规则和 custom icon registration 见 [Icon system documentation](/docs/reference/icons)。

## 16. Non-goals

SlexKit v0 不试图提供：

- 无稳定的公开兼容性承诺（v0/beta）。
- 非纯 JSON 跨平台协议。
- 不对浏览器原生 API 做自动安全加固。
- 不通过启发式扫描代码块猜测是否渲染。
- 不隐式将 display UI 包装为函数调用。

SlexKit 的核心边界是：Markdown-friendly、explicit fence、small interactive fragments、host-chosen trust boundary。
