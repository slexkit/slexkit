---
title: "Streamdown 接入"
category: "宿主集成"
status: published
order: 18
summary: "React/Streamdown 适配器示例，只接管显式 slex 代码块并保留普通 Markdown。"
tags: streamdown, react, markdown, adapter
components: section, table, callout, code-block
difficulty: 中级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Streamdown 接入

`@slexkit/streamdown` 适用于已经使用 Streamdown 渲染 Markdown 的 React 页面。这里复用官网的 RC 低通滤波器内容，说明 SlexKit 组件在 Streamdown 页面中的接入方式。

本地运行：

```sh
bun run build:core
bun run --filter @slexkit/streamdown build
bun examples/dev-server.mjs streamdown
```

源码位于 [`examples/streamdown`](https://github.com/slexkit/slexkit/tree/main/examples/streamdown)。Streamdown 与 Tiptap 示例使用同一份 RC 低通滤波器内容，便于对照两种宿主的接入方式。

<iframe class="slex-example-live-frame" src="/adapter-demos/streamdown/?embed=1" title="Streamdown 可运行示例"></iframe>

[打开集成指南](/zh-CN/docs/guides/integration) · [查看可运行源码](https://github.com/slexkit/slexkit/tree/main/examples/streamdown)

## 接入方式

| 项目 | 约定 |
| --- | --- |
| Fence language | `slex` |
| Runtime | `trusted` 或 `secure` |
| Markdown 宿主 | Streamdown |

普通 Markdown、公式、表格和非 `slex` 代码块继续由 Streamdown 渲染。只写状态的 `slex` fence 不渲染独立 UI，但会写入同一 artifact state，供后续可渲染 fence 读取。

最小配置：

```tsx
import { Streamdown } from "streamdown";
import { createSlexKitRenderer } from "@slexkit/streamdown";
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/streamdown/style.css";

const slexkitRenderer = createSlexKitRenderer({
  domain: "message-1",
  showChrome: false
});

export function Message({ markdown }: { markdown: string }) {
  return (
    <Streamdown plugins={{ renderers: [slexkitRenderer] }}>
      {markdown}
    </Streamdown>
  );
}
```

如果项目已经以 Streamdown 作为 Markdown 渲染层，使用 `@slexkit/streamdown`。如果宿主有自己的 Markdown parser 或 renderer，直接接入自定义 Markdown host API。
