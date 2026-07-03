---
title: 集成
category: Guides
status: ready
order: 25
summary: "在 Streamdown、Tiptap、Obsidian 或自定义 Markdown 渲染器中接入 slex 代码块。"
slexkitRenderMode: component
---

# 集成

按宿主选择接入路径。所有接入方式都只渲染明确标记为 `slex` 的代码块；普通 `js`、`json` 或未标记代码块仍按原来的 Markdown 代码块显示。

完整 API 见 [宿主集成参考](/docs/reference/integration)。

## 选择接入方式

| 宿主 | 使用包 | 适用场景 | 默认模式 |
|---|---|---|---|
| React / Streamdown | `@slexkit/streamdown` | 聊天消息、React Markdown 页面 | trusted 或 secure |
| Tiptap | `@slexkit/tiptap` | 需要 `slex` 代码块预览，并保留 Markdown 导入/导出的编辑器文档 | trusted |
| Svelte Markdown | `slexkit` | Svelte Markdown 渲染器适配 | trusted 或 secure |
| Obsidian | `slexkit/obsidian-slexkit` | Obsidian 文档中的 SlexKit 渲染 | trusted readonly |
| 自定义 Markdown 宿主 | `slexkit` | 产品自己的 Markdown 渲染器、文档查看器或 Svelte 站点渲染器 | trusted 或 secure |

Streamdown 和 Tiptap 使用各自的适配器包；React 聊天界面通常接入 Streamdown renderer。自定义 Markdown 渲染器直接使用 `createSlexKitMarkdownRuntimeHost`。Obsidian 插件可从 Community Plugins 安装；只有测试未发布构建时才需要查看 [插件仓库](https://github.com/slexkit/obsidian-slexkit)。

每个 npm 包的 exports 和安装组合见 [包与安装](/docs/reference/packages)。

## 可运行示例

可运行示例用于确认实际渲染行为。Streamdown 和 Tiptap 使用同一段 RC 低通滤波器 Markdown，便于对比只读渲染和编辑器预览的差异：

- [Streamdown 接入](/zh-CN/examples/streamdown-host) 对应 `examples/streamdown`。
- [Tiptap 编辑器接入](/zh-CN/examples/tiptap-host) 对应 `examples/tiptap`。

## Svelte Markdown 宿主

SlexKit 官网是 Svelte 应用，但它的 Markdown 集成不是独立发布的适配器包。应用已经自行解析 Markdown 时，可以按下面的方式把 `slex` 代码块交给 SlexKit：

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

如果产品已经有自己的 Markdown 解析、Svelte 组件树或文档外壳，就使用这个模式。接入层只识别 `slex` fence，普通代码块继续按代码显示；每篇文档传入稳定的 `artifactId`，并在卸载时调用 cleanup。

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

安装 runtime、主题、适配器和 Tiptap peer dependencies：

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown
```

应用入口导入样式：

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";
```

禁用 StarterKit 默认代码块，并注册 SlexKit 适配器：

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

这个适配器扩展 Tiptap 的 `CodeBlock`，只接管语言严格等于 `slex` 的块，普通代码块仍作为可编辑源码保留。同一个编辑器内的块共享 artifact 运行时，因此只包含状态的 fence 可以影响后续可渲染 fence。Tiptap 接入默认使用 trusted mode；不可信 Markdown 应放到 secure Web host 中处理。

## Streamdown 选项

需要显式设置 domain、源码显示、playground mode 或 secure mode 时，使用 `createSlexKitRenderer`：

```tsx
import { createSlexKitRenderer } from "@slexkit/streamdown";

const renderer = createSlexKitRenderer({
  domain: "chat-thread-42",
  showChrome: false,
  showSource: false,
  runtime: "trusted"
});
```

同一 `domain` 下只包含状态的 fence 可为后续 layout fence 提供状态：

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

安全运行时的部署步骤见 [安全运行时接入](security-runtime)。policy 字段见 [安全运行时契约](/docs/reference/security)。

## Obsidian

> 只安装 Obsidian 插件时，开发者集成段落可以跳过。直接在 Obsidian 的 **Community plugins** 中搜索 **SlexKit**，安装并启用即可。

Obsidian 插件只在阅读模式里渲染本地 vault 中的 `slex` 代码块，不会把渲染结果写回笔记。

可从 Obsidian Community Plugins 安装：

1. 打开 **Settings -> Community plugins**。
2. 如有需要，关闭 **Restricted mode**。
3. 搜索 **SlexKit**。
4. 安装并启用插件。

社区插件声明支持 Obsidian 1.5.0+，并且只标记为桌面端可用。

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
      title: "Vault 状态",
      "badge:ready": { label: "就绪", tone: "success" },
    "text:note": { text: "SlexKit 在阅读模式中渲染这段内容。" }
    }
  }
}
```

Vault 状态：就绪。
````

同一笔记中的 block 共享一个 Markdown artifact 运行时，只包含状态的 fence 可影响后续可渲染 fence。

## Obsidian 说明

官方插件按本地 vault 内容处理，不应用来隔离第三方 Markdown 或 agent 直接输出。

渲染不可信内容时，应在 Web host 中使用 secure mode，并显式配置 sandbox frame 与 host policy。

## 集成清单

- 只处理语言标记为 `slex` 的 fence
- 为不支持 SlexKit 的环境保留 Markdown fallback
- 为每个文档、消息或笔记设置稳定的 artifact/domain
- 容器卸载时调用 cleanup；文档销毁时 dispose artifact
- 不可信内容使用 secure mode，不使用 trusted mode
- API、生命周期和安全细节链接到 reference 页面，不在宿主指南里重复展开
