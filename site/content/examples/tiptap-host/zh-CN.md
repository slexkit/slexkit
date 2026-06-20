---
title: "Tiptap 编辑器适配"
category: "宿主集成"
status: published
order: 19
summary: "Tiptap CodeBlock extension：预览显式 slex fence，同时保留 Markdown roundtrip。"
tags: tiptap, editor, markdown, adapter
components: section, table, callout, code-block
difficulty: 中级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Tiptap 编辑器适配

这个页面展示 `@slexkit/tiptap` 的接入边界：Tiptap 继续负责编辑和 Markdown roundtrip，SlexKit 只替换显式 `slex` 代码块。

在仓库中运行：

```sh
bun run build:core
bun run --filter @slexkit/tiptap build
bun examples/dev-server.mjs tiptap
```

示例源码位于 [`examples/tiptap`](https://github.com/slexkit/slexkit/tree/main/examples/tiptap)。它复用官网 RC 低通滤波器 Markdown，便于和 Streamdown 示例对照。

<iframe class="slex-example-live-frame" src="/adapter-demos/tiptap/?embed=1" title="Tiptap 可运行示例"></iframe>

[打开集成指南](/zh-CN/docs/guides/integration) · [查看可运行源码](https://github.com/slexkit/slexkit/tree/main/examples/tiptap)

## 接入边界

| 项目 | 约定 |
| --- | --- |
| Block type | `codeBlock` |
| Fence language | `slex` |
| Runtime | `trusted` |

Tiptap 负责文档编辑和 Markdown roundtrip。State-only `slex` fence 与后续 preview block 共享 artifact runtime；非 `slex` code block 保持 Tiptap 原生行为。

最小接入代码：

```ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";

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

产品需要编辑器内 preview 时使用这个包；只读 Markdown 输出优先使用 Streamdown 或自定义 Markdown host API。
