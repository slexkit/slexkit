---
title: "assistant-ui 接入"
category: "宿主集成"
status: published
order: 17
summary: "在 assistant-ui 的 Streamdown text message parts 中渲染显式 slex fences。"
tags: assistant-ui, react, streamdown, markdown, adapter
components: section, table, callout, code-block
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# assistant-ui 接入

assistant-ui 项目已经用 `@assistant-ui/react-streamdown` 渲染文本消息时，可以用 `@slexkit/assistant-ui` 替换 text part 里的 `slex` language block。thread、composer、message parts、runtime 和 tool UI 仍由 assistant-ui 处理。

下面的可运行演示是一个静态 assistant-ui transcript，用于验证 adapter 在 assistant-ui message-part 上下文中的渲染行为；它不连接模型、API key 或 ToolHost 流程。

```sh
bun run --filter @slexkit/assistant-ui build
bun examples/dev-server.mjs assistant-ui
```

源码位于 [`examples/assistant-ui`](https://github.com/slexkit/slexkit/tree/main/examples/assistant-ui)。页面用 `useExternalStoreRuntime` 和 `AssistantRuntimeProvider` 构造 thread，再通过 `SlexKitAssistantStreamdownText` 渲染 text parts。

<iframe class="slex-example-live-frame" src="/adapter-demos/assistant-ui/?embed=1" title="assistant-ui 可运行示例"></iframe>

[打开集成指南](/zh-CN/docs/guides/integration) · [查看可运行源码](https://github.com/slexkit/slexkit/tree/main/examples/assistant-ui)

安装：

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom
```

导入样式：

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/assistant-ui/style.css";
```

接到 assistant message：

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

模型输出示例：

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

## 处理范围

| 项目 | 约定 |
| --- | --- |
| Fence language | `slex` |
| Runtime | 默认 `secure` |
| Markdown host | `@assistant-ui/react-streamdown` |
| ToolHost | 不处理 |

ToolHost/tool-call 渲染需要单独接入。这个 adapter 只处理 assistant-ui text message parts 里的 Markdown fence runtime。

项目已有 `StreamdownTextPrimitive` 包装时，可以用 `createSlexKitAssistantStreamdownComponents()` 只合并 `slex` language override。
