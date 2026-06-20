---
title: "Streamdown 宿主适配"
category: "宿主集成"
status: published
order: 18
summary: "React/Streamdown 集成路径：只渲染显式 slex fence，普通 Markdown 和普通代码块继续交给 Streamdown。"
tags: streamdown, react, markdown, adapter
components: section, table, callout, code-block
difficulty: 中级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Streamdown 宿主适配

这个页面展示 `@slexkit/streamdown` 的接入边界：Streamdown 继续负责 Markdown，SlexKit 只处理显式 `slex` fence。

在仓库中运行：

```sh
bun run build:core
bun run --filter @slexkit/streamdown build
bun examples/dev-server.mjs streamdown
```

示例源码位于 [`examples/streamdown`](https://github.com/slexkit/slexkit/tree/main/examples/streamdown)。它复用官网 RC 低通滤波器 Markdown，便于和 Tiptap 示例对照。

<iframe class="slex-example-live-frame" src="/adapter-demos/streamdown/?embed=1" title="Streamdown 可运行示例"></iframe>

[打开集成指南](/zh-CN/docs/guides/integration) · [查看可运行源码](https://github.com/slexkit/slexkit/tree/main/examples/streamdown)

## 接入边界

| 项目 | 约定 |
| --- | --- |
| Fence language | `slex` |
| Runtime | `trusted` 或 `secure` |
| Markdown 宿主 | Streamdown |

普通 Markdown、公式、表格和非 `slex` 代码块继续由 Streamdown 渲染。State-only `slex` fence 会和后续可渲染 fence 共享 artifact state。

最小接入代码：

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

宿主已经使用 Streamdown 渲染 Markdown 时，优先使用这个包；宿主拥有自己的 Markdown parser 或 renderer 时，直接使用自定义 Markdown host API。
