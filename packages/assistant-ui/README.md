# @slexkit/assistant-ui

assistant-ui Streamdown text renderer for SlexKit fenced artifact blocks.

Use this package when assistant-ui message text already renders through
`@assistant-ui/react-streamdown`. It replaces explicit `slex` fenced code blocks
inside assistant message text; threads, messages, composer, runtime, and tool UI
stay with assistant-ui.

## Install

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom
```

Import styles once in the app:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/assistant-ui/style.css";
```

## Minimal Usage

Use the component where assistant-ui renders message text parts:

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

For app-authored, reviewed content, trusted mode can be enabled:

```tsx
<SlexKitAssistantStreamdownText artifactId="message-1" runtime="trusted" />
```

## Existing StreamdownTextPrimitive

For an existing `StreamdownTextPrimitive` wrapper, merge only the SlexKit
language override:

```tsx
import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";
import { createSlexKitAssistantStreamdownComponents } from "@slexkit/assistant-ui";

const componentsByLanguage = createSlexKitAssistantStreamdownComponents({
  artifactId: "message-1",
  runtime: "secure",
  secureFrame: { runtimeUrl: "/slexkit.runtime.js" },
});

export function MarkdownText() {
  return <StreamdownTextPrimitive componentsByLanguage={componentsByLanguage} />;
}
```

## Model Output

Ask the model to emit Slex only in explicit `slex` fenced blocks. Ordinary
Markdown and non-`slex` code blocks stay with assistant-ui's Streamdown renderer.

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

## Trust Boundary

The default runtime is `secure`, because assistant messages often contain direct
model output. Secure mode requires a public SlexKit runtime module:

```sh
npx -y slexkit copy-runtime public/slexkit.runtime.js
```

Serve that file with:

```http
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

Use `runtime="trusted"` only for content authored or reviewed by the application.

## ToolHost

This package handles message text only. assistant-ui tool calls, approvals, and
form submissions need their own integration. Use ToolHost for structured
user-return flows.
