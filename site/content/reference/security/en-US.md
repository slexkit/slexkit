---
title: Security Runtime Contract
category: Reference
status: ready
order: 50
summary: "Threat model, sandbox iframe deployment, host policy, postMessage bridge, and fail-closed behavior."
slexkitRenderMode: component
---

# Security Runtime Contract

The secure runtime defines what untrusted Slex source can and cannot do, how the host authorizes capabilities, and how sandbox isolation works.

## Threat model

- The host page and host application are trusted.
- Slex source may be untrusted.
- Secure artifacts run inside a sandbox iframe.
- The iframe uses an opaque origin by default (no `allow-same-origin`).
- Slex source must not access the host DOM, cookies, `localStorage`, `IndexedDB`, or host global objects.

Secure mode confines expression execution to an isolated environment and consolidates sensitive capabilities under the host `policy` and `api.*`.

## Authorization source

The sole authorization source is the `HostRuntimePolicy` provided by the host. Slex source fields such as `capabilities`, `permissions`, `api`, or other top-level declarations cannot grant themselves authority.

All capabilities are accessed through `api.*`:

```
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

Capabilities not exposed through `api.*` are unsupported.

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
  animation?: {
    enabled: boolean;
  };
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

Network is denied by default unless `policy.network.enabled` is `true`. The policy constrains:
- HTTP method (only listed methods allowed)
- Origin (supports `*`, exact match, `protocol://*` protocol wildcard, and `protocol://*.domain` subdomain wildcard)
- Request headers (only listed headers pass; `Authorization`, `Cookie`, `Proxy-Authorization`, `Set-Cookie`, and Sec-Fetch headers are always blocked)
- Credentials mode
- Request body size
- Request timeout
- Response body size
- Response content-type

`hostAdapter.fetch` can replace the actual request implementation. `hostAdapter.onNetworkLog` is observational only; it must not alter runtime behavior.

### Timer, animation, and canvas

- **Timer**: denied by default. When enabled, subject to `maxTimers` (total concurrent) and `minIntervalMs` (minimum delay). All timers and intervals are cleaned up on dispose.
- **Animation**: denied by default. Controlled via `animation.enabled`; `api.raf` is the only animation primitive.
- **Canvas**: denied by default. When enabled, subject to `maxCanvases`, `maxPixels`, and `allowedContexts`.

### Execution monitoring

`execution.heartbeatIntervalMs` controls how often the sandbox sends a heartbeat to the host. `execution.maxUnresponsiveMs` defines the maximum silence before the sandbox is terminated as unresponsive.

## HostRuntimeAdapter

The adapter allows the host to override or observe runtime behavior:

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

`onNetworkLog` and `onRuntimeError` are audit hooks; they must not change runtime behavior. Errors thrown within them are silently caught.

## Sandbox iframe deployment

The secure frame imports the main runtime module from a `runtimeUrl`:

```ts
mountSecureArtifact(script, container, {
  frame: {
    runtimeUrl: "/slexkit.runtime.js"
  }
});
```

This URL must serve as a public ES module and return:

```
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

This is server or deployment layer configuration; it cannot be set from frontend JavaScript.

### CSP

The sandbox iframe is served via `srcdoc` with a strict Content-Security-Policy:

```
default-src 'none'
script-src 'nonce-{random}' 'unsafe-eval' {runtimeOrigin}
connect-src 'none'
img-src data: blob:
style-src 'unsafe-inline'
font-src data:
form-action 'none'
base-uri 'none'
```

A random nonce is generated for each frame instance. `unsafe-eval` is required because Slex source expression evaluation uses `eval()` inside the sandbox.

### Sandbox attribute

The iframe requires `allow-scripts`. `allow-same-origin` is **blocked by default** because it would weaken the opaque origin isolation. Only set `unsafeAllowSameOrigin: true` explicitly if the host accepts the risk:

```ts
frame: {
  unsafeAllowSameOrigin: true,  // only with explicit host acceptance
  sandbox: "allow-scripts allow-same-origin"
}
```

Do not add `allow-same-origin` to fix CORS or debugging issues.

## postMessage bridge protocol

The host and sandbox communicate via `window.postMessage`. All messages are tagged with `channel: "slexkit-secure"`.

### Host -Sandbox messages

| Type | Purpose |
|------|---------|
| `mount` | Sends Slex source, policy, theme to render |
| `dispose` | Tells sandbox to tear down |
| `fetch-result` | Returns fetch response or error |
| `slots` | Synchronizes artifact slot positions |

### Sandbox -Host messages

| Type | Purpose |
|------|---------|
| `ready` | Runner module loaded and listening |
| `mounted` | Artifact render confirmed |
| `disposed` | Sandbox teardown acknowledged |
| `heartbeat` | Periodic liveness signal |
| `error` | Mount or runtime error |
| `fetch` | Proxied network request |
| `slot-size` | Artifact slot height report |

Every host→sandbox message includes an `id` and `token`. The token is opaque, cryptographically random, and scoped to a single mount instance. Messages with mismatched tokens are rejected.

Messages are verified: the sandbox checks `event.source === window.parent`; the host checks `event.source === iframe.contentWindow`.

## Artifact slot bridge

Multiple Markdown fences belonging to one artifact share a single sandbox iframe. The host sends slot rectangles to the sandbox, which renders each fence's output inside the corresponding slot container. The sandbox reports each slot's rendered height back via `slot-size` messages.

A `ResizeObserver` on the host side and inside the sandbox keeps positions and heights synchronized. This allows visual continuity across fence boundaries while keeping all execution confined to one isolation context.

## Heartbeat watchdog

When `execution.maxUnresponsiveMs` is set, the host monitors the sandbox heartbeat interval. If no heartbeat arrives within the threshold, the iframe is terminated, a diagnostic alert (`role="alert"`) is rendered, and a `console.error` is emitted.

## Fail-closed behavior

If the iframe cannot load the runtime, does not send a ready/mounted message, or the heartbeat times out, SlexKit:

1. Removes the unresponsive iframe.
2. Renders a `role="alert"` diagnostic element with a description of the failure.
3. Emits the same information via `console.error`.

Load timeout is configurable via `frame.loadTimeoutMs` (default: 8000ms).

## Escape hatches

### `unsafeInlineExecution`

Allows a secure artifact to execute inline in the host page with an injected secure runtime API. **Intended for testing or host-trusted content only.** Not recommended for untrusted paths.

```ts
mountSecureArtifact(script, container, {
  policy,
  hostAdapter,
  unsafeInlineExecution: true
});
```

### `unsafeAllowSameOrigin`

Allows `allow-same-origin` in the sandbox attribute. **Reduces isolation strength**; only use when the host explicitly accepts the risk.

```ts
frame: {
  sandbox: "allow-scripts allow-same-origin",
  unsafeAllowSameOrigin: true
}
```

## Sandbox hardening

When the sandbox runner starts, it hardens the global scope:

**Blocked network globals** -`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `Worker`, `SharedWorker`, and `navigator.sendBeacon` are replaced with functions that throw, ensuring all network traffic must go through the bridge.

**Blocked scheduling globals** -`setTimeout`, `setInterval`, `requestAnimationFrame` are replaced with functions that throw, directing code to `api.setTimeout()`, `api.setInterval()`, and `api.raf()`.

**Canvas prototype wrapping** -`HTMLCanvasElement.prototype.getContext` is wrapped to enforce canvas policy on context creation. `OffscreenCanvas` is replaced with a subclass that validates dimensions on construction.

## Maintenance principles

- New capabilities must define a policy field first, then an `api.*` method, then the bridge.
- Slex source declarations are never an authorization source.
- Default to opaque origin.
- Always fail closed.
- Log and error hooks are observational; they must not alter runtime behavior.
