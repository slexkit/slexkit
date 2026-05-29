---
title: 运行时模型
category: Reference
status: ready
order: 30
summary: "mount、ingest、boot、namespace store、lifecycle hooks、component state 与 runtime API。"
slexkitRenderMode: component
---

# 运行时模型

SlexKit core runtime 的 entry points、namespace store、component state、lifecycle hooks 与 expression evaluation。

Slex source 语法见 [protocol specification](/docs/reference/spec)。Secure mode 隔离模型见 [security runtime contract](/docs/reference/security)。

## Entry points

### `mount(input, container, options)`

解析 Slex source object 或 source string，将 `g` 合并进 namespace store，把组件树渲染到 `container`，并返回 root cleanup function。

```ts
function mount(
  input: SlexExpression | string,
  container: HTMLElement,
  options?: MountOptions
): () => void;
```

`MountOptions` 支持 `theme`、`dir`、`labels`、`api`。同一 `container` 再次调用 `mount()` 会先清空旧 root，再追加新 root。cleanup 只卸载当前 root，不会删除 namespace store。

### `ingest(input)`

导入 state-only Slex：更新 `g`，不渲染 UI。Markdown runtime host 用它处理 state-only fences。

```ts
function ingest(input: SlexExpression | string): boolean;
```

### `disposeNamespace(namespace)`

释放 namespace 下的 roots、cleanups、store entries 和 expression caches。文档、消息域或页面区域永久移除时调用。root cleanup 不等于 namespace disposal。

```ts
function disposeNamespace(namespace: string): void;
```

### `boot(options)`

增强静态页面中显式标记的 Slex blocks，例如 `<pre><code class="language-slex">`。

```ts
function boot(options?: BootOptions): void;
```

React/Streamdown、Obsidian 等宿主通常应直接使用 Markdown runtime host，而不是 `boot()`。

### `register(type, renderer, options)`

注册组件类型和 state mode。

```ts
function register(
  type: string,
  renderer: ComponentRenderer,
  options?: ComponentRegistrationOptions
): void;
```

### `configureComponentScope(options)`

为 framework adapter 配置 flush function，用于在响应式更新后同步 DOM。

```ts
function configureComponentScope(options: { flush?: () => void }): void;
```

## Namespace store

`namespace` 是状态域。多个 mount 使用同一 namespace 时共享 store：

- 新 `g` 会 deep merge 到旧 `g`：函数覆盖，对象递归合并，数组替换，scalar 覆盖。
- 新 `layout` 替换当前 layout，不做 deep merge。
- Component instance state 在 namespace 内持久化。
- Expression caches 按 namespace 管理。

这允许文档、消息域或工具面板增量更新 UI，同时保留状态。

## Component instance state

命名组件可以暴露实例状态，具体可写 prop 由组件注册时的 state mode 决定：

| Mode | Writable prop | Behavior |
|------|---------------|----------|
| `value` | `value` | 可读写 |
| `checked` | `checked`, `value` | 两者同步，可读写 |
| `enabled` | `enabled` | switch 启用状态，可读写 |
| `readable` | 无 | 可读，写入会 console warning |
| `none` | 无 | 不暴露状态 |

```js
{
  layout: {
    "slider:threshold": { value: 42 },
    "text:preview": { "$content": "'Threshold: ' + threshold.value" }
  }
}
```

重复使用同名组件会共享 namespace-level state。`$for` 中同名组件也共享一个 state instance。

## Lifecycle hooks

Runtime 会按约定调用 `g` 上的 hooks：

```txt
g.onMount_<name>()      -after component is appended to DOM
g.onUnmount_<name>()    -before component is removed from DOM
g.onUpdate_<name>()     -after $for item index or item reference changes
```

这些 hooks 适用于普通组件、`$if` branch 和 `$for` slot。root cleanup 与 `disposeNamespace()` 都会触发 `onUnmount`。

## Component disposer

Framework 组件、event listeners、subscriptions 和外部资源应把 cleanup 绑定到组件 DOM 元素：

```ts
import { register, attachComponentDisposer } from "slexkit/runtime";

register("custom", (props, name, ctx) => {
  const el = ctx.document.createElement("div");
  const stop = subscribeSomething();
  attachComponentDisposer(el, stop);
  return el;
});
```

元素卸载时 runtime 会调用 disposer。官方 Svelte adapter 用这个机制销毁 Svelte component instance。

## Expression evaluation context

`$` read-pipes 和 `on*` write-pipes 可访问：

| Variable | Type | Availability |
|----------|------|--------------|
| `g` | reactive state proxy | always |
| `api` | host-injected capabilities | `mount()` 传入 `api` 时 |
| `$event` | event data | `on*` handlers |
| `$item` | current array item | `$for` context |
| `$index` | current array index | `$for` context |
| `$key` | current item key | `$for` context |
| named component state | e.g. `threshold.value` | named components |

Trusted mode 使用 `new Function()` 进行表达式求值。求值错误会被捕获，并以包含 namespace 和 path 的 warning 输出；运行时使用上一次有效值作为 fallback。
