---
title: "Tiptap Editor Integration"
category: "Host Integration"
status: published
order: 19
summary: "A Tiptap CodeBlock adapter that previews explicit slex blocks while preserving ordinary code blocks and Markdown import/export."
tags: tiptap, editor, markdown, adapter
components: section, table, callout, code-block
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Tiptap Editor Integration

Use `@slexkit/tiptap` when editor documents need live previews for `slex` code blocks. Tiptap keeps editing, selection, and Markdown import/export; SlexKit only takes over CodeBlock nodes whose language is `slex`.

Run it from the repository:

```sh
bun run build:core
bun run --filter @slexkit/tiptap build
bun examples/dev-server.mjs tiptap
```

The source lives in [`examples/tiptap`](https://github.com/slexkit/slexkit/tree/main/examples/tiptap). The Tiptap and Streamdown examples use the same RC low-pass filter content, so editor and read-only hosts can be checked against the same input.

<iframe class="slex-example-live-frame" src="/adapter-demos/tiptap/?embed=1" title="Tiptap runnable example"></iframe>

[Open the integration guide](/docs/guides/integration) · [View runnable source](https://github.com/slexkit/slexkit/tree/main/examples/tiptap)

## Scope

| Item | Convention |
| --- | --- |
| Block type | `codeBlock` |
| Fence language | `slex` |
| Runtime | `trusted` |

Tiptap keeps document editing and Markdown import/export. State-only `slex` fences share one artifact runtime with later preview blocks; non-`slex` code blocks stay native to Tiptap.

Minimal wiring:

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

Use `@slexkit/tiptap` for editor previews. For read-only Markdown output, use Streamdown or the custom Markdown host API instead.
