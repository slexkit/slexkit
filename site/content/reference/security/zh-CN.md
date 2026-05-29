---
title: 安全运行时契约
category: Reference
status: ready
order: 50
summary: "Threat model、sandbox iframe deployment、host policy、postMessage bridge 与 fail-closed behavior。"
slexkitRenderMode: component
---

# 安全运行时契约

Secure runtime 决定了不可信 Slex source 能做什么、不能做什么，宿主如何授权能力，以及 sandbox isolation 如何工作。

## Threat model

- 宿主页和宿主应用是可信的。
- Slex source 可能不可信。
- Secure artifacts 运行在 sandbox iframe 中。
- iframe 默认使用 opaque origin，不加 `allow-same-origin`。
- Slex source 不应访问宿主 DOM、cookies、`localStorage`、`IndexedDB` 或宿主 globals。

Secure mode 隔离 expression execution，敏感能力收敛到 host `policy` 和 `api.*`。

## Authorization source

唯一授权来源是宿主提供的 `HostRuntimePolicy`。Slex source 中的 `capabilities`、`permissions`、`api` 或其他 top-level declarations 都不能自我授权。

所有能力通过 `api.*` 访问：

```txt
api.get(url, options)
api.post(url, body, options)
api.fetch(url, options)
api.setTimeout(fn, ms)
api.clearTimeout(id)
api.setInterval(fn, ms)
api.clearInterval(id)
api.raf(fn)
api.cancelRaf(id)
api.createCanvas(width, height)
api.getCanvasContext(canvas, contextId, options)
api.onDispose(fn)
api.now()
api.isTimeoutError(error)
api.isNetworkError(error)
api.isPolicyError(error)
api.errorMessage(error)
```

没有通过 `api.*` 暴露的能力都不受支持。

## HostRuntimePolicy

```ts
type HostRuntimePolicy = {
  network?: {
    enabled: boolean;
    methods: ("GET" | "POST")[];
    allowOrigins: string[];
    allowHeaders?: string[];
    allowContentTypes?: string[];
    credentials: "omit" | "same-origin" | "include";
    timeoutMs: number;
    maxBodyBytes: number;
    maxResponseBytes?: number;
  };
  timer?: {
    enabled: boolean;
    maxTimers: number;
    minIntervalMs: number;
  };
  animation?: { enabled: boolean };
  canvas?: {
    enabled: boolean;
    maxCanvases?: number;
    maxPixels?: number;
    allowedContexts?: ("2d" | "webgl" | "webgl2" | "bitmaprenderer")[];
  };
  execution?: {
    heartbeatIntervalMs?: number;
    maxUnresponsiveMs?: number;
  };
};
```

### Network policy

Network 默认拒绝，除非 `policy.network.enabled` 为 `true`。Policy 限制：

- HTTP method
- Origin，支持 `*`、exact match、`protocol://*` 和 `protocol://*.domain`
- Request headers
- Credentials mode
- Request body size
- Request timeout
- Response body size
- Response content-type

`Authorization`、`Cookie`、`Proxy-Authorization`、`Set-Cookie` 和 Sec-Fetch headers 始终阻断。`hostAdapter.fetch` 可替换实际请求实现；`hostAdapter.onNetworkLog` 只能观察，不能改变 runtime 行为。

### Timer, animation, and canvas

- **Timer**：默认拒绝。开启后受 `maxTimers` 和 `minIntervalMs` 限制，dispose 时清理全部 timers 与 intervals。
- **Animation**：默认拒绝。只通过 `api.raf` 暴露。
- **Canvas**：默认拒绝。开启后受 `maxCanvases`、`maxPixels`、`allowedContexts` 限制。

### Execution monitoring

`execution.heartbeatIntervalMs` 控制 sandbox heartbeat 频率。`execution.maxUnresponsiveMs` 定义最大静默时间，超过后 sandbox 会被视为 unresponsive 并终止。

## HostRuntimeAdapter

Adapter 允许宿主替换或观察部分 runtime behavior：

```ts
type HostRuntimeAdapter = {
  fetch?: (request: HostFetchRequest) => Promise<NetworkResult>;
  onNetworkLog?: (event: RuntimeNetworkLogEvent) => void;
  onRuntimeError?: (event: RuntimeErrorEvent) => void;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => TimerId;
  clearTimeout?: (id: TimerId) => void;
  setInterval?: (fn: () => void, ms: number) => TimerId;
  clearInterval?: (id: TimerId) => void;
  requestAnimationFrame?: (fn: (time: number) => void) => RafId;
  cancelAnimationFrame?: (id: RafId) => void;
};
```

`onNetworkLog` 和 `onRuntimeError` 是 audit hooks，不能改变 runtime behavior；内部抛错会被静默捕获。

## Sandbox iframe deployment

Secure frame 从 `runtimeUrl` 导入主 runtime module：

```ts
mountSecureArtifact(script, container, {
  frame: {
    runtimeUrl: "/slexkit.runtime.js"
  }
});
```

这个 URL 必须作为 public ES module 提供，并返回：

```txt
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

这是 server 或 deployment layer 配置，不能由 frontend JavaScript 事后设置。

### CSP

Sandbox iframe 通过 `srcdoc` 创建，并使用严格 Content-Security-Policy：

```txt
default-src 'none'
script-src 'nonce-{random}' 'unsafe-eval' {runtimeOrigin}
connect-src 'none'
img-src data: blob:
style-src 'unsafe-inline'
font-src data:
form-action 'none'
base-uri 'none'
```

每个 frame instance 生成随机 nonce。`unsafe-eval` 是必要的，因为 Slex expression evaluation 在 sandbox 内使用 eval。

### Sandbox attribute

iframe 需要 `allow-scripts`。`allow-same-origin` 默认 blocked，因为它会削弱 opaque-origin isolation。只有宿主显式接受风险时，才使用 `unsafeAllowSameOrigin: true`：

```ts
frame: {
  unsafeAllowSameOrigin: true,
  sandbox: "allow-scripts allow-same-origin"
}
```

不要为了修复 CORS 或调试问题添加 `allow-same-origin`。

## postMessage bridge protocol

宿主和 sandbox 通过 `window.postMessage` 通信。所有消息都带有 `channel: "slexkit-secure"`。

### Host to sandbox messages

| Type | Purpose |
|------|---------|
| `mount` | 发送 Slex source、policy、theme |
| `dispose` | 通知 sandbox teardown |
| `fetch-result` | 返回 fetch response 或 error |
| `slots` | 同步 artifact slot positions |

### Sandbox to host messages

| Type | Purpose |
|------|---------|
| `ready` | Runner module 已加载并监听 |
| `mounted` | Artifact render confirmed |
| `disposed` | Sandbox teardown acknowledged |
| `heartbeat` | liveness signal |
| `error` | mount 或 runtime error |
| `fetch` | proxied network request |
| `slot-size` | artifact slot height report |

每条 host-to-sandbox message 包含 `id` 和 `token`。Token 是 opaque、cryptographically random，并绑定到单个 mount instance。Token 不匹配的消息会被拒绝。

Sandbox 验证 `event.source === window.parent`；host 验证 `event.source === iframe.contentWindow`。

## Artifact slot bridge

属于同一 artifact 的多个 Markdown fences 共享一个 sandbox iframe。Host 把 slot rectangles 发送给 sandbox；sandbox 在对应 slot container 中渲染每个 fence 的输出，并通过 `slot-size` 回传高度。

Host 和 sandbox 两侧的 `ResizeObserver` 保持位置与高度同步。这允许 fence 边界之间保持视觉连续，同时所有执行都限制在一个隔离上下文中。

## Heartbeat watchdog

配置 `execution.maxUnresponsiveMs` 后，host 会监控 sandbox heartbeat。若超过阈值没有 heartbeat，iframe 会被终止，页面渲染 `role="alert"` diagnostic，并输出 `console.error`。

## Fail-closed behavior

如果 iframe 无法加载 runtime、没有发送 ready/mounted message，或 heartbeat timeout，SlexKit 会：

1. 移除无响应 iframe。
2. 渲染包含失败描述的 `role="alert"` diagnostic element。
3. 通过 `console.error` 输出同样信息。

Load timeout 可通过 `frame.loadTimeoutMs` 配置，默认 8000ms。

## Escape hatches

### `unsafeInlineExecution`

允许 secure artifact 在宿主页内以内联方式执行，并注入 secure runtime API。只用于测试或 host-trusted content，不推荐用于 untrusted paths。

### `unsafeAllowSameOrigin`

允许 sandbox attribute 中的 `allow-same-origin`。它会降低隔离强度，只能在宿主明确接受风险时使用。

```ts
frame: {
  sandbox: "allow-scripts allow-same-origin",
  unsafeAllowSameOrigin: true
}
```

## Sandbox hardening

Sandbox runner 启动时会 harden global scope：

- **Blocked network globals**：`fetch`、`XMLHttpRequest`、`WebSocket`、`EventSource`、`Worker`、`SharedWorker`、`navigator.sendBeacon` 会被替换为 throwing functions。
- **Blocked scheduling globals**：`setTimeout`、`setInterval`、`requestAnimationFrame` 会被替换为 throwing functions，引导代码使用 `api.setTimeout()`、`api.setInterval()` 和 `api.raf()`。
- **Canvas prototype wrapping**：包装 `HTMLCanvasElement.prototype.getContext`，并用 subclass 替换 `OffscreenCanvas` 以校验尺寸。

## Maintenance principles

- 新 capability 必须先定义 policy field，再定义 `api.*` method，最后接入 bridge。
- Slex source declarations 永远不是授权来源。
- 默认使用 opaque origin。
- 始终 fail closed。
- Log 和 error hooks 只能观察，不能改变行为。
