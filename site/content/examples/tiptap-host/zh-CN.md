---
title: "Tiptap 编辑器接入"
category: "宿主集成"
status: published
order: 19
summary: "Tiptap CodeBlock 适配器：只把显式 slex 代码块渲染为预览，普通代码块和 Markdown 导入/导出保持 Tiptap 行为。"
tags: tiptap, editor, markdown, adapter
components: section, table, callout, code-block
difficulty: 中级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Tiptap 编辑器接入

`@slexkit/tiptap` 适用于需要在编辑器中预览 SlexKit 组件的文档。这个示例复用官网的 RC 低通滤波器内容，展示 SlexKit 组件如何放进 Tiptap 编辑器。

本地运行：

```sh
bun run build:core
bun run --filter @slexkit/tiptap build
bun examples/dev-server.mjs tiptap
```

源码位于 [`examples/tiptap`](https://github.com/slexkit/slexkit/tree/main/examples/tiptap)。Tiptap 与 Streamdown 示例使用同一份 RC 低通滤波器内容，便于对照编辑器宿主和只读渲染宿主的接入方式。

<iframe class="slex-example-live-frame" src="/adapter-demos/tiptap/?embed=1" title="Tiptap 可运行示例"></iframe>

[打开集成指南](/zh-CN/docs/guides/integration) · [查看可运行源码](https://github.com/slexkit/slexkit/tree/main/examples/tiptap)

## 接入方式

| 项目 | 约定 |
| --- | --- |
| Block type | `codeBlock` |
| Fence language | `slex` |
| Runtime | `trusted` |

Tiptap 负责文档编辑和 Markdown 导入/导出。只写状态的 `slex` fence 与后续预览块共享 artifact runtime；非 `slex` code block 保持 Tiptap 原生行为。

最小配置：

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

需要编辑器内预览时使用 `@slexkit/tiptap`。只读 Markdown 输出通常使用 Streamdown 或自定义 Markdown host API。
