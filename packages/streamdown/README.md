# @slexkit/streamdown

Streamdown custom renderer for Slex fenced UI blocks.

## Install

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom
```

Import both style sheets in your app:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/streamdown/style.css";
```

## Minimal Usage

```tsx
import { Streamdown } from "streamdown";
import { createSlexKitRenderer } from "@slexkit/streamdown";

export function Message({ id, markdown }: { id: string; markdown: string }) {
  const renderer = createSlexKitRenderer({ domain: id });

  return (
    <Streamdown plugins={{ renderers: [renderer] }}>
      {markdown}
    </Streamdown>
  );
}
```

## Vercel AI SDK

```tsx
import { useChat } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { createSlexKitRenderer } from "@slexkit/streamdown";

const renderers = new Map<string, ReturnType<typeof createSlexKitRenderer>>();

function rendererForMessage(id: string) {
  let renderer = renderers.get(id);
  if (!renderer) {
    renderer = createSlexKitRenderer({ domain: id });
    renderers.set(id, renderer);
  }
  return renderer;
}

export function Chat() {
  const { messages, status } = useChat();

  return messages.map((message) => {
    const renderer = rendererForMessage(message.id);

    return message.parts.map((part, index) =>
      part.type === "text" ? (
        <Streamdown
          key={index}
          isAnimating={status === "streaming"}
          plugins={{ renderers: [renderer] }}
        >
          {part.text}
        </Streamdown>
      ) : null,
    );
  });
}
```

## Model Output

Ask the model to emit Slex only in explicit `slex` fenced blocks. The body is JavaScript-compatible Slex source: a plain object literal with native JS state and expression strings.

````md
```slex
{
  namespace: "status_demo",
  g: {},
  layout: {
    "text:status": { text: "3/4 checks complete" }
  }
}
```

**Status:** 3/4 checks complete
````

The renderer intentionally handles only `slex` fences by default. It does not sniff generic JavaScript code blocks.

To show the same Slex source inside the embedded playground UI, keep the `slex` fence and switch the renderer mode with fence meta:

````md
```slex render="playground" title="Editable demo"
{
  namespace: "editable_demo",
  layout: {
    "text:status": { text: "Rendered inside the playground" }
  }
}
```
````

You can also make playground display the default for a Markdown surface:

```tsx
const renderer = createSlexKitRenderer({ renderMode: "playground" });
```

### Fence meta resolution

Fence meta values resolve to the render mode via a flexible parser:

| Meta value | Resolved mode |
|------------|--------------|
| `render="playground"`, `as="playground"`, `mode="playground"` | `playground` |
| `render="editor"`, `render="workbench"` | `playground` |
| `render="component"`, `as="component"`, `as="preview"` | `component` |
| No meta | Fallback to `renderMode` option |

Playground meta also supports `title`, `mode`, `height`/`previewMinHeight`, `webUrl`/`playgroundUrl`, and `pluginVersion`.

## Streaming behavior

During streaming (`isIncomplete: true`), the renderer shows a placeholder instead of attempting to parse partial Slex source. The placeholder defaults to "Rendering SlexKit..." and can be customized:

```tsx
<SlexKitRenderer
  code={code}
  isIncomplete={true}
  placeholder={<Spinner />}
/>
```

State-only blocks (source with `namespace` and `g` but no renderable `layout`) return no visible block. When the renderer has a `domain`, the adapter remounts that domain in document order, so removing a state-only fence also clears the state it seeded.

## Trust Boundary

Slex source is JavaScript-compatible object literal syntax with runtime expressions. This package is intended for trusted or controlled model output. Do not treat it as a sandbox for arbitrary third-party Markdown.

For untrusted model output, opt into the secure runtime. The renderer will pass the fence source text into a sandbox frame and route sensitive capabilities through host policy enforced `api.*` methods:

```tsx
import { createSlexKitRenderer } from "@slexkit/streamdown";
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/streamdown/style.css";

const renderer = createSlexKitRenderer({
  runtime: "secure",
  securePolicy: {
    network: {
      enabled: true,
      methods: ["GET", "POST"],
      allowOrigins: ["https://api.example.com"],
      credentials: "omit",
      timeoutMs: 15000,
      maxBodyBytes: 4096,
    },
    timer: { enabled: true, maxTimers: 8, minIntervalMs: 16 },
    animation: { enabled: true },
    canvas: { enabled: true, maxCanvases: 4, maxPixels: 1048576, allowedContexts: ["2d"] },
    execution: { heartbeatIntervalMs: 1000, maxUnresponsiveMs: 5000 },
  },
  secureFrame: {
    runtimeUrl: "/slexkit.runtime.js",
    loadTimeoutMs: 8000,
  },
});
```

The secure renderer uses the main `slexkit.runtime.js` module as its iframe runner. You do not need to ship a second runner file.

Copy the runtime file into your public static directory:

```sh
npx -y slexkit copy-runtime public/slexkit.runtime.js
```

The file must be served by your app or CDN with these response headers:

```http
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

This header is configured in your deployment layer, not inside `createSlexKitRenderer()`. Secure iframes intentionally run with an opaque origin, so the browser treats `runtimeUrl` as a cross-origin ES module import even when the URL is on your own site. Do not add `allow-same-origin` to the iframe sandbox to bypass this; that weakens isolation.

If the iframe cannot load or mount the runtime, SlexKit renders a `role="alert"` diagnostic next to the iframe and logs the same message to `console.error`. Tune the diagnostic delay with `secureFrame.loadTimeoutMs`.

For the full trust boundary and capability contract, see the root package security runtime reference.

Examples:

```js
// next.config.js
export default {
  async headers() {
    return [
      {
        source: "/slexkit.runtime.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "text/javascript" },
        ],
      },
    ];
  },
};
```

```text
# Netlify / Cloudflare Pages _headers
/slexkit.runtime.js
  Access-Control-Allow-Origin: *
  Content-Type: text/javascript
```

If your Markdown surface already owns a page-level SlexKit runtime, pass it into the renderer so block mount/unmount events are delegated to that host:

```tsx
import {
  createSlexKitMarkdownRuntimeHost,
} from "slexkit";
import { createSlexKitRenderer } from "@slexkit/streamdown";

const runtimeHost = createSlexKitMarkdownRuntimeHost({
  mode: "secure",
  policy,
  secureFrame: {
    runtimeUrl: "/slexkit.runtime.js",
  },
});

const renderer = createSlexKitRenderer({
  runtimeHost,
});
```

## Custom Renderer Options

```tsx
import { createSlexKitRenderer } from "@slexkit/streamdown";

export const renderer = createSlexKitRenderer({
  languages: ["slex"],          // Fence language tags to process (default: ["slex"])
  renderMode: "component",      // "component" | "playground"
  runtime: "trusted",           // "trusted" | "secure"
  domain: "message-or-doc-id",  // Artifact id and namespace prefix for blocks
  showChrome: true,             // Show CodeBlockContainer + toolbar (default: true)
  showSource: false,            // Show source code in a details element
  className: "my-block",        // Extra CSS class on wrapper
  useGlobalRuntimeHost: false,  // Use global markdown runtime host
  playgroundUrl: "/playground.html",  // Custom playground iframe URL
  placeholder: null,            // ReactNode shown during streaming
  onError(error, code) {
    console.error("Failed to render SlexKit", error, code);
  },
});
```

### Standalone component usage

`SlexKitRenderer` is also exported for direct use without Streamdown:

```tsx
import { SlexKitRenderer } from "@slexkit/streamdown";

function MyBlock() {
  return (
    <SlexKitRenderer
      code={`{
        namespace: "inline",
        g: {},
        layout: { "text:hello": { text: "Hello" } }
      }`}
      language="slex"
      renderMode="component"
    />
  );
}
```

## Error handling

Parse errors display a diagnostic panel with line, column, excerpt, and detail. Runtime mount errors render a similar alert. The `onError` callback fires for both cases, receiving the error object and the source code string.

## Documentation

- [Official Streamdown host example](https://slexkit.app.simgor.cn/examples/streamdown-host)
- [Runnable example source](https://github.com/slexkit/slexkit/tree/main/examples/streamdown)
- [SlexKit Security runtime](https://github.com/slexkit/slexkit/blob/main/site/content/reference/security/en-US.md)
- [SlexKit Host integration](https://github.com/slexkit/slexkit/blob/main/site/content/reference/integration/en-US.md)
- [SlexKit Usage guide](https://github.com/slexkit/slexkit/blob/main/site/content/reference/usage/en-US.md)

## Release validation

The package is considered release-ready when the repository checks pass:

```sh
bun run build
bun run test
bun run smoke:release
```

Those checks verify the public renderer exports, `style.css` subpath export, trusted rendering, secure frame rendering, runtime-host delegation, state-only fences, domain isolation, embedded playground mode, and package version sync.
