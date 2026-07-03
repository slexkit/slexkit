---
title: 集成
category: Guides
status: ready
order: 25
summary: "在 assistant-ui、Streamdown、Tiptap、Obsidian 或自定义 Markdown 渲染器中接入 slex 代码块。"
slexkitRenderMode: component
---

# 集成

这页按宿主说明怎么接入 SlexKit。所有接入方式都只渲染明确标记为 `slex` 的代码块；普通 `js`、`json` 或未标记代码块仍按原来的 Markdown 代码块显示。

需要更完整的 API 说明时，再看 [Host Integration reference](/docs/reference/integration)。

## 选择接入方式

| 宿主 | 安装或使用 | 渲染位置 | 默认模式 |
|---|---|---|---|
| assistant-ui | `@slexkit/assistant-ui` | 聊天消息文本 | secure |
| React / Streamdown | `@slexkit/streamdown` | 聊天消息、React Markdown 页面 | trusted 或 secure |
| Tiptap | `@slexkit/tiptap` | 编辑器里的 `slex` 代码块预览 | trusted |
| Svelte Markdown | `slexkit` | 自己的 Markdown renderer | trusted 或 secure |
| Obsidian | Community Plugins 里的 **SlexKit** | 本地笔记阅读模式 | trusted readonly |
| 自定义 Markdown 宿主 | `slexkit` | 产品文档页、文档查看器、站点 renderer | trusted 或 secure |

assistant-ui、Streamdown 和 Tiptap 有现成包。自定义 Markdown renderer 可直接使用 `createSlexKitMarkdownRuntimeHost`。Obsidian 插件可从 Community Plugins 安装；测试未发布版本时再看 [插件仓库](https://github.com/slexkit/obsidian-slexkit)。

每个 npm 包的 exports 和安装组合见 [包与安装](/docs/reference/packages)。

## 可运行示例

可运行示例用于确认实际渲染行为。Streamdown 和 Tiptap 使用同一段 RC 低通滤波器 Markdown，便于对比只读渲染和编辑器预览的差异：

- [Streamdown 接入](/zh-CN/examples/streamdown-host)：源码在 `examples/streamdown`。
- [Tiptap 编辑器接入](/zh-CN/examples/tiptap-host)：源码在 `examples/tiptap`。
- [assistant-ui 接入](/zh-CN/examples/assistant-ui-host)：源码在 `examples/assistant-ui`。

## Svelte Markdown 宿主

官网本身就是 Svelte 应用里的自定义 Markdown renderer。这个接入没有单独发布 adapter 包；应用自行解析 Markdown 时，可以按下面的方式把 `slex` 代码块交给 SlexKit：

```js
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import MarkdownRenderer from "./MarkdownRenderer.svelte";

const runtimeHost = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",
  theme: "host-shadcn"
});

mount(MarkdownRenderer, {
  target: container,
  props: {
    content: markdown,
    artifactId: "docs-page",
    runtimeHost,
    slexkitRenderMode: "component"
  }
});
```

这个模式适合产品自行控制 Markdown parser、Svelte component tree 或文档壳的场景。接入时保留三件事：只识别 `slex` 代码块，给同一篇文档传入稳定的 `artifactId`，文档卸载时调用 cleanup。

## Streamdown

安装运行时、主题、插件和 React peer dependencies：

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom
```

应用入口导入样式：

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/streamdown/style.css";
```

将 SlexKit renderer 注册到 Streamdown：

```tsx
import { Streamdown } from "streamdown";
import { slexkitRenderer } from "@slexkit/streamdown";

export function Message({ markdown }: { markdown: string }) {
  return (
    <Streamdown plugins={{ renderers: [slexkitRenderer] }}>
      {markdown}
    </Streamdown>
  );
}
```

上面的 renderer 只替换 `slex` 代码块，其他代码块仍由 Streamdown 渲染。

## assistant-ui

如果 assistant-ui 项目已经用 `@assistant-ui/react-streamdown` 渲染文本消息，可以换成 `@slexkit/assistant-ui`。它只替换 text part 里的 `slex` 代码块，线程、输入框、消息状态和工具调用 UI 仍按 assistant-ui 原来的方式处理。

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom
```

应用入口导入样式：

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/assistant-ui/style.css";
```

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

这个包不接管 assistant-ui 的 tool call、审批或表单提交。需要结构化用户输入时，仍使用 ToolHost 或既有 assistant-ui 工具调用层。

## Tiptap

安装 SlexKit adapter、主题和 Tiptap 依赖：

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown
```

应用入口导入样式：

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";
```

禁用 StarterKit 默认 code block，然后注册 SlexKit 扩展：

```ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";

const editor = new Editor({
  element: document.querySelector("#editor"),
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Markdown,
    createSlexKitTiptapExtension({ artifactId: "doc-1" })
  ],
  content: markdown,
  contentType: "markdown"
});
```

这个扩展只接管语言等于 `slex` 的代码块。其他代码块仍是普通 Tiptap code block，可以继续编辑和导出。

同一个 editor 里的 `slex` 块共享状态：前面的 state-only 块可以给后面的 layout 块提供数据。Tiptap 接入默认使用 trusted mode；如果 Markdown 来自未审查用户输入或第三方内容，应放到 Web host 里用 secure mode 渲染。

## Streamdown 选项

需要自己设置 message/domain、隐藏源码、开启 playground 或切到 secure mode 时，使用 `createSlexKitRenderer`：

```tsx
import { createSlexKitRenderer } from "@slexkit/streamdown";

const renderer = createSlexKitRenderer({
  domain: "chat-thread-42",
  showChrome: false,
  showSource: false,
  runtime: "trusted"
});
```

同一个 `domain` 下，前面的 state-only 代码块可以给后面的 layout 代码块提供状态：

````md
```slex
{
  namespace: "calc",
  g: { value: 21 }
}
```

```slex
{
  namespace: "calc",
  layout: {
    "text:answer": { "$text": "'answer: ' + (g.value * 2)" }
  }
}
```
````

内容来自未经审查的用户输入、第三方 Markdown 或 agent 直接输出时，切到 secure mode：

```tsx
const renderer = createSlexKitRenderer({
  runtime: "secure",
  secureFrame: {
    runtimeUrl: "/slexkit.runtime.js"
  },
  securePolicy: {
    execution: {
      maxUnresponsiveMs: 30000
    }
  }
});
```

部署 sandbox iframe、runtime 文件和 policy 字段时，参考 [安全运行时接入](security-runtime) 和 [安全运行时契约](/docs/reference/security)。

## Obsidian

> 只安装 Obsidian 插件时，不需要阅读本页前面的开发者集成内容。直接在 Obsidian 的 **Community plugins** 中搜索 **SlexKit**，安装并启用即可。

Obsidian 插件只在阅读模式里渲染本地 vault 中的 `slex` 代码块，不会把渲染结果写回笔记。

现在可直接从 Obsidian Community Plugins 安装：

1. 打开 **Settings -> Community plugins**。
2. 如有需要，关闭 **Restricted mode**。
3. 搜索 **SlexKit**。
4. 安装并启用插件。

社区插件声明支持 Obsidian 1.5.0+，并且只标记为桌面端可用。

测试尚未发布的构建时，可以用 BRAT：

```text
BRAT repository: https://github.com/slexkit/obsidian-slexkit
```

手动安装时将 GitHub release assets 放入 vault：

```text
.obsidian/plugins/slexkit/
  main.js
  manifest.json
  styles.css
```

在 Obsidian 的 community plugin 设置中启用 **SlexKit**。

## Obsidian 示例

笔记中写入显式 `slex` fence：

````md
```slex
{
  namespace: "vault_status",
  layout: {
    "card:status": {
      title: "Vault status",
      "badge:ready": { label: "Ready", tone: "success" },
      "text:note": { text: "由 SlexKit 在阅读模式渲染。" }
    }
  }
}
```

Vault 状态：已就绪。
````

同一篇笔记里的 `slex` 代码块共享状态；前面的状态块可以影响后面的渲染块。

## Obsidian 安全说明

官方插件按本地 vault 内容处理，不是第三方 Markdown 或 agent 输出的安全沙箱。

渲染不可信内容时，在 Web host 中使用 secure mode，并配置 sandbox frame 与 host policy。

## 接入时检查

- 只处理语言标记为 `slex` 的 fence
- 为不支持 SlexKit 的环境保留 Markdown fallback
- 为每个文档、消息或笔记设置稳定 artifact/domain
- 容器卸载时调用 cleanup；文档销毁时 dispose artifact
- 不可信内容使用 secure mode，不使用 trusted mode
