---
title: 集成
category: Guides
status: ready
order: 25
summary: "面向 Streamdown、Tiptap、Obsidian 与自定义 Markdown 宿主的插件接入指南，用于渲染显式 Slex fence。"
slexkitRenderMode: component
---

# 集成

SlexKit 在本仓库提供 Streamdown 与 Tiptap 包，并在独立发布仓库维护官方 Obsidian 插件。这些集成都只处理显式 `slex` fence，不扫描普通代码块。SlexKit 官网自身也使用自定义 Markdown host 路径。完整 API 和 host 契约见 [Host Integration reference](/docs/reference/integration)。

## 插件选择

| 宿主 | 使用包 | 适用场景 | 运行边界 |
|---|---|---|---|
| React / Streamdown | `@slexkit/streamdown` | 聊天消息、AI 输出、React Markdown 页面 | trusted 或 secure |
| Tiptap | `@slexkit/tiptap` | 需要交互式 `slex` code block preview 与 Markdown roundtrip 的编辑器文档 | trusted |
| Obsidian | `slexkit/obsidian-slexkit` | 本地 vault reading mode 中的 Slex fence | trusted readonly |
| 自定义 Markdown 宿主 | `slexkit` | 产品自己的 Markdown renderer、文档查看器或 Svelte 官网 renderer | trusted 或 secure |

宿主是 Streamdown 或 Tiptap 时使用本仓库里的包；Obsidian 安装和发布以独立的 [SlexKit 插件仓库](https://github.com/slexkit/obsidian-slexkit) 为准。自定义 Markdown renderer 直接使用 `createSlexKitMarkdownRuntimeHost`。

包安装细节和发布边界由 [Package Boundaries](/docs/reference/packages) 维护。

## 可运行示例

仓库里包含两个可直接在浏览器打开的宿主示例。两者使用同一份 RC 低通滤波器 Markdown source，方便对比不同宿主的行为：

- [Streamdown 宿主适配](/zh-CN/examples/streamdown-host) 对应 `examples/streamdown`。
- [Tiptap 编辑器适配](/zh-CN/examples/tiptap-host) 对应 `examples/tiptap`。

## Svelte Markdown 宿主

SlexKit 官网是 Svelte 应用，但它的 Markdown 集成不是一个独立公开 adapter 包。它是自定义 Markdown renderer 的参考形态：

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

产品自己拥有 Markdown parser、Svelte component tree 或文档壳时，使用这个模式。宿主职责不变：只识别 `slex` fence，普通代码块继续作为代码显示，传入稳定的 `artifactId`，并在文档卸载时调用 cleanup。

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

默认 renderer 只处理 `slex` fence，普通代码块由 Streamdown 自行渲染。

## Tiptap

安装 runtime、主题、adapter 和 Tiptap peer dependencies：

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown
```

应用入口导入样式：

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";
```

禁用 StarterKit 默认 code block，并注册 SlexKit adapter：

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

这个 adapter 扩展 Tiptap 的 `CodeBlock`，只接管语言严格等于 `slex` 的块，普通 code block 仍作为可编辑源码保留。同一个 editor 内的 block 共享 artifact runtime，所以 state-only fence 可以影响后续可渲染 fence。当前默认 trusted runtime；不可信 Markdown 应放到 secure Web host 中处理。

## Streamdown 选项

需要明确 domain、源码控制、playground mode 或 secure mode 时，使用 `createSlexKitRenderer`：

```tsx
import { createSlexKitRenderer } from "@slexkit/streamdown";

const renderer = createSlexKitRenderer({
  domain: "chat-thread-42",
  showChrome: false,
  showSource: false,
  runtime: "trusted"
});
```

同一 `domain` 下的 state-only fence 可为后续 layout fence 提供状态：

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

内容来自未经审查的用户输入、第三方 Markdown 或 agent 直接输出时，切换到 secure mode 并配置 host policy：

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

安全运行时部署清单见 [安全运行时接入](security-runtime)。精确 policy 字段见 [Security Runtime Contract](/docs/reference/security)。

## Obsidian

> 如果你的目标只是安装 Obsidian 插件，不需要阅读本页前面的开发者集成内容。直接在 Obsidian 的 **Community plugins** 中搜索 **SlexKit**，安装并启用即可。

Obsidian 插件面向本地 vault 内容。它在 reading mode 中注册 `slex` code block processor，将 fence 渲染为只读交互片段，不将结果写回笔记。

现在可直接从 Obsidian Community Plugins 安装：

1. 打开 **Settings -> Community plugins**。
2. 如有需要，关闭 **Restricted mode**。
3. 搜索 **SlexKit**。
4. 安装并启用插件。

当前社区版本为 desktop-only，兼容 Obsidian 1.5.0+。移动端支持应在真实 mobile vault 测试通过后再开启。

BRAT 和手动 release assets 仍可用于测试尚未发布的构建：

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
      "text:note": { text: "Rendered by SlexKit in reading mode." }
    }
  }
}
```

Vault status: Ready.
````

同一笔记中的 block 共享一个 Markdown artifact runtime，state-only fence 可影响后续可渲染 fence。

## Obsidian 边界

官方插件是 trusted readonly adapter。内容来自用户本地 vault，不是第三方 Markdown 或 agent 输出的安全沙箱。

渲染不可信内容时，应在 Web host 中使用 secure mode，并显式配置 sandbox frame 与 host policy。

## 集成清单

- 只处理语言标记为 `slex` 的 fence
- 为不支持 SlexKit 的环境保留 Markdown fallback
- 为每个文档、消息或笔记设置稳定 artifact/domain
- 容器卸载时调用 cleanup；文档销毁时 dispose artifact
- 不可信内容使用 secure mode，不使用 trusted mode
- API、生命周期、包边界和安全细节链接到 reference 页面，不在宿主指南中重复维护
