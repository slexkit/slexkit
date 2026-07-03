---
title: "assistant-ui Integration"
category: "Host Integration"
status: published
order: 17
summary: "assistant-ui adapter for rendering explicit slex fences inside Streamdown text message parts."
tags: assistant-ui, react, streamdown, markdown, adapter
components: section, table, callout, code-block
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# assistant-ui Integration

When an assistant-ui app already renders text through `@assistant-ui/react-streamdown`, use `@slexkit/assistant-ui` to replace the `slex` language block inside text parts. Threads, composer, message parts, runtime, and tool UI stay with assistant-ui.

The runnable demo below is a static assistant-ui transcript. It verifies rendering inside assistant-ui's message-part context without connecting a model, API key, or ToolHost flow.

```sh
bun run --filter @slexkit/assistant-ui build
bun examples/dev-server.mjs assistant-ui
```

The source lives in [`examples/assistant-ui`](https://github.com/slexkit/slexkit/tree/main/examples/assistant-ui). The page uses `useExternalStoreRuntime` and `AssistantRuntimeProvider` for the thread, then renders text parts through `SlexKitAssistantStreamdownText`.

<iframe class="slex-example-live-frame" src="/adapter-demos/assistant-ui/?embed=1" title="assistant-ui runnable example"></iframe>

[Open the integration guide](/docs/guides/integration) · [View runnable source](https://github.com/slexkit/slexkit/tree/main/examples/assistant-ui)

Install the wrapper and peers:

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom
```

Import styles once:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/assistant-ui/style.css";
```

Use it in the assistant message:

```tsx
import { MessagePrimitive } from "@assistant-ui/react";
import { SlexKitAssistantStreamdownText } from "@slexkit/assistant-ui";

export function AssistantMessage() {
  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.Parts>
        {({ part }) =>
          part.type === "text" ? (
            <SlexKitAssistantStreamdownText
              artifactId="message-1"
              runtime="secure"
              secureFrame={{ runtimeUrl: "/slexkit.runtime.js" }}
            />
          ) : null
        }
      </MessagePrimitive.Parts>
    </MessagePrimitive.Root>
  );
}
```

Example model output:

````md
```slex
{
  namespace: "assistant_status",
  g: {},
  layout: {
    "text:status": { text: "Rendered inside assistant-ui." }
  }
}
```
````

## Scope

| Item | Convention |
| --- | --- |
| Fence language | `slex` |
| Runtime | `secure` by default |
| Markdown host | `@assistant-ui/react-streamdown` |
| ToolHost | Not adapted |

ToolHost/tool-call rendering is a separate integration layer. This adapter is only the Markdown fence runtime for assistant-ui text message parts.

For an existing custom `StreamdownTextPrimitive`, merge only the SlexKit language override with `createSlexKitAssistantStreamdownComponents()`.
