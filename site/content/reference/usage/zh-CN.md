---
title: Slex 用法参考
category: Reference
status: ready
order: 20
summary: "Slex source 结构、props、directives、events、theming、自定义组件与 ToolHost 边界参考。"
slexkitRenderMode: component
---

# Slex 用法参考

Slex source 怎么写？props、directives、events、theming、自定义组件，以及 ToolHost 边界都在这里。首次接入请先阅读 [开始使用](/docs/guides/quick-start)。精确协议兼容性以 [Slex Specification](/docs/reference/spec) 为准。

## 安装

大多数宿主安装根包：

```sh
npm install slexkit
```

```js
import { mount } from "slexkit";
import "slexkit/style.css";
```

无组件运行时入口：

```sh
npm install slexkit @slexkit/runtime
```

```js
import { mount, register } from "@slexkit/runtime";
```

这个入口不会自动注册官方 Svelte components。需要官方组件时，使用根包 `slexkit`，或显式导入 `@slexkit/components-svelte`。

包边界和宿主安装组合见 [Package Boundaries](/docs/reference/packages)。

## Slex source 结构

Slex source 是 JavaScript object literal：

```js
{
  slex: "0.1",
  namespace: "demo",
  g: { count: 0 },
  layout: {
    "button:add": { text: "Add", onclick: "g.count++" },
    "text:value": { "$content": "'Count: ' + g.count" }
  }
}
```

- `slex`：可选协议标记；当前公开协议使用 `"0.1"`。
- `namespace`：状态域标识，默认是 `"default"`。
- `g`：响应式状态和逻辑，包括函数与数据。
- `layout`：组件树。

运行时也接受裸组件树简写：包含 `:` 的组件键会被归一化为 `{ namespace: "default", g: {}, layout: <tree> }`。公开文档和共享示例仍建议使用完整 envelope。

## Props

### 静态 props

静态值会原样传给组件：

```js
"text:title": { text: "Hello World" }
```

### 动态读管道（`$`）

`$` 前缀 key 的字符串值会作为 JavaScript 表达式求值，传给组件时去掉 `$` 前缀：

```js
"text:value": { "$content": "'Count: ' + g.count" }
```

最终传给组件的是 `content`。表达式读取到的响应式依赖变化后会自动重新求值。

### 写管道（`on*`）

`on*` 前缀 key 的字符串值会作为 JavaScript statement 执行：

```js
"button:add": { onclick: "g.count++" }
"input:name": { onchange: "g.name = String($event || '')" }
```

事件处理器可以访问 `$event`。

### 结构 directives

`$if`、`$for`、`$key` 是结构 directives，不会作为 props 传给组件。

## `$if` 条件渲染

`$if` 控制组件及其子树是否挂载：

```js
"card:panel": {
  "$if": "g.visible",
  "text:body": { text: "I am visible" }
}
```

表达式为 truthy 时组件挂载；为 falsy 时组件卸载。若定义了 `$enter` 或 `$leave`，运行时会在对应阶段应用动画并执行清理。

## `$for` 数组迭代

`$for` 为数组中的每一项渲染一个组件：

```js
"text:item": {
  "$for": "g.items",
  "$key": "id",
  "$content": "$item.label"
}
```

`$for` 上下文变量包括 `$item`、`$index`、`$key`。命名组件还会注入同名变量，例如 `"card:user"` 会让表达式可访问 `user`。

### Key 策略

`$key` 支持：

- `"$value"`：使用 primitive item 自身作为 key。
- `"id"` 或其他属性名：从 object item 读取对应属性。
- 省略：优先使用 `item.id`，否则回退到 index 并输出 console warning。

primitive 数组应显式写 `$key: "$value"`。

### `$for` 更新算法

1. **Delete phase**：移除不再存在的 key，可触发 leave animation。
2. **Add/update/reorder phase**：创建新项，更新保留项上下文，并按数组顺序重排 DOM。
3. **Trim phase**：防御性移除多余子节点。

当 item 的 index 或引用变化时，会调用 `onUpdate_<name>`。

## Events

事件处理器使用 `on*` 写管道。对可写组件（`value`、`checked` 或 `enabled` mode），组件原生 change/input 会先同步组件实例状态，再执行 handler。

```js
"input:name": { onchange: "g.name = String($event || '')" }
```

`$event` 包含组件发出的事件数据。

## Trusted 与 secure mode

### Trusted mode（默认）

Trusted mode 在宿主页 realm 中执行 Slex source，适用于应用生成内容、仓库维护内容或已审查片段。

```js
import { mount } from "slexkit";

mount(script, container, { theme: "host-shadcn" });
```

### Secure mode

不可信或 agent 生成的 Slex source 运行在 opaque origin 的 sandbox iframe 中。敏感能力由宿主 policy 授权。

```js
import { mountSecureArtifact } from "slexkit";

mountSecureArtifact(script, container, {
  policy: {},
  frame: { runtimeUrl: "/slexkit.runtime.js" },
});
```

部署清单见 [安全运行时接入](/docs/guides/security-runtime)。完整 policy、sandbox、bridge 与 fail-closed 行为见 [Security Runtime Contract](/docs/reference/security)。

## Theming

主题模式由 `theme` option 决定：

| Value | Behavior |
|-------|----------|
| `"auto"` | 从 container 检测已知 theme class，默认回退到 `"uno"` |
| `"host-shadcn"` | shadcn/ui compatible |
| `"uno"` | Uno/Flowbite compatible |
| `"flowbite"` | Flowbite compatible |

`dir` 支持 `ltr`、`rtl`、`auto`，会从继承的 `dir` 属性或 document element 解析。

```js
mount(script, container, { theme: "host-shadcn", dir: "auto" });
```

## 自定义组件

通过 render function 注册组件类型：

```ts
import { register } from "slexkit";

register("custom", (props, name, ctx) => {
  const el = ctx.document.createElement("div");
  el.textContent = String(props.label ?? name);
  return el;
}, { state: "value" });
```

`RenderContext` 提供：

| Property | Type | Description |
|----------|------|-------------|
| `g` | reactive proxy | 全局状态 |
| `std` | `SlexKitStdlib` | 纯确定性 helper |
| `api` | `Record<string, unknown>` | 宿主注入能力 |
| `dir` | `"ltr"` 或 `"rtl"` | 解析后的方向 |
| `labels` | `Partial<Record<string, string>>` | 运行时文案 |
| `id` | `string \| null` | 组件 name |
| `emit` | `(event, data?) => void` | 事件发射器 |
| `children` | `Record<string, unknown>` | 嵌套组件树 |
| `document` | `Document` | owner document |
| `renderTree` | function | 递归渲染 helper |

使用 `attachComponentDisposer(el, fn)` 将清理逻辑绑定到组件 DOM 生命周期。

## ToolHost

ToolHost 处理需要向宿主返回结构化用户输入的 UI，例如确认、选择和表单。它与展示型 `slex` fence 分离。

内置 templates：

- `confirm-action`：yes/no 确认
- `choose-options`：单选或多选
- `option-list`：可滚动选项列表
- `fill-form`：带 submit 的结构化表单

Templates 会编译成标准 Slex source。`submit` 组件是完成边界；它只用于 tool templates，不用于普通 display fences。
