---
title: "Streamdown Host Adapter"
category: "Host Integration"
status: published
order: 18
summary: "A React/Streamdown integration path that renders only explicit slex fences while leaving ordinary Markdown and code blocks to Streamdown."
tags: streamdown, react, markdown, adapter
components: section, table, callout, code-block
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Streamdown Host Adapter

This page shows the integration boundary for `@slexkit/streamdown`: Streamdown keeps rendering Markdown, and SlexKit handles only explicit `slex` fences.

Run it from the repository:

```sh
bun run build:core
bun run --filter @slexkit/streamdown build
bun examples/dev-server.mjs streamdown
```

The source lives in [`examples/streamdown`](https://github.com/slexkit/slexkit/tree/main/examples/streamdown). It uses the same RC low-pass filter Markdown as the site example, so it is easy to compare with Tiptap.

<iframe class="slex-example-live-frame" src="/adapter-demos/streamdown/?embed=1" title="Streamdown runnable example"></iframe>

[Open the integration guide](/docs/guides/integration) · [View runnable source](https://github.com/slexkit/slexkit/tree/main/examples/streamdown)

## Integration Boundary

| Item | Convention |
| --- | --- |
| Fence language | `slex` |
| Runtime | `trusted` or `secure` |
| Markdown host | Streamdown |

Ordinary Markdown, math, tables, and non-`slex` code blocks stay with Streamdown. State-only `slex` fences share artifact state with later renderable fences.

The minimal wiring is:

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

Use this package when the host already renders Markdown through Streamdown. Use the custom Markdown host API directly when the host owns its own parser or renderer.
