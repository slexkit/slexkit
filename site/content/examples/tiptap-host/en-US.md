---
title: "Tiptap Editor Adapter"
category: "Host Integration"
status: published
order: 19
summary: "A Tiptap CodeBlock extension that previews explicit slex fences while preserving Markdown roundtrip."
tags: tiptap, editor, markdown, adapter
components: section, table, callout, code-block
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Tiptap Editor Adapter

This page shows the integration boundary for `@slexkit/tiptap`: Tiptap keeps editing and Markdown roundtrip, and SlexKit replaces only explicit `slex` code blocks.

Run it from the repository:

```sh
bun run build:core
bun run --filter @slexkit/tiptap build
bun examples/dev-server.mjs tiptap
```

The source lives in [`examples/tiptap`](https://github.com/slexkit/slexkit/tree/main/examples/tiptap). It uses the same RC low-pass filter Markdown as Streamdown, so the host behavior is easy to compare.

<iframe class="slex-example-live-frame" src="/adapter-demos/tiptap/?embed=1" title="Tiptap runnable example"></iframe>

[Open the integration guide](/docs/guides/integration) · [View runnable source](https://github.com/slexkit/slexkit/tree/main/examples/tiptap)

## Integration Boundary

| Item | Convention |
| --- | --- |
| Block type | `codeBlock` |
| Fence language | `slex` |
| Runtime | `trusted` |

Tiptap keeps document editing and Markdown roundtrip. State-only `slex` fences share one artifact runtime with later preview blocks; non-`slex` code blocks stay native to Tiptap.

The minimal wiring is:

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

Use this package when the product needs an editor preview. For read-only Markdown output, use Streamdown or the custom Markdown host API instead.
