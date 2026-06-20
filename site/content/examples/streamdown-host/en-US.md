---
title: "Streamdown Integration"
category: "Host Integration"
status: published
order: 18
summary: "A React/Streamdown adapter that takes over explicit slex fences and leaves ordinary Markdown and code blocks to Streamdown."
tags: streamdown, react, markdown, adapter
components: section, table, callout, code-block
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Streamdown Integration

Use `@slexkit/streamdown` when a React page already renders Markdown with Streamdown. The adapter takes over fences whose language is `slex`; Streamdown continues to render the rest of the document, including prose, math, and ordinary code blocks.

Run it from the repository:

```sh
bun run build:core
bun run --filter @slexkit/streamdown build
bun examples/dev-server.mjs streamdown
```

The source lives in [`examples/streamdown`](https://github.com/slexkit/slexkit/tree/main/examples/streamdown). The Streamdown and Tiptap examples use the same RC low-pass filter content, so both hosts can be checked against the same input.

<iframe class="slex-example-live-frame" src="/adapter-demos/streamdown/?embed=1" title="Streamdown runnable example"></iframe>

[Open the integration guide](/docs/guides/integration) · [View runnable source](https://github.com/slexkit/slexkit/tree/main/examples/streamdown)

## Responsibilities

| Item | Convention |
| --- | --- |
| Fence language | `slex` |
| Runtime | `trusted` or `secure` |
| Markdown host | Streamdown |

Ordinary Markdown, math, tables, and non-`slex` code blocks stay with Streamdown. State-only `slex` fences do not render standalone UI, but write to the same artifact state used by later renderable fences.

Minimal wiring:

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

Use `@slexkit/streamdown` when Streamdown is the Markdown layer. If the host owns its parser or renderer, wire SlexKit through the custom Markdown host API instead.
