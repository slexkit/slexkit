---
title: Integration
category: Guides
status: ready
order: 25
summary: "Plugin setup guide for Streamdown, Tiptap, Obsidian, and custom Markdown hosts that render explicit Slex fences."
slexkitRenderMode: component
---

# Integration

SlexKit ships Streamdown and Tiptap packages in this repository and maintains the official Obsidian plugin in a separate release repository. These integrations process only explicit `slex` fences — they don't scan ordinary JavaScript, JSON, or unlabeled code blocks. The SlexKit website also uses the custom Markdown host path internally. For the full API and host contract, see the [Host Integration reference](/docs/reference/integration).

## Plugin Selection

| Host | Package | Use case | Runtime boundary |
|---|---|---|---|
| React / Streamdown | `@slexkit/streamdown` | Chat messages, AI output, React Markdown pages | trusted or secure |
| Tiptap | `@slexkit/tiptap` | Editor documents that need interactive `slex` code block previews and Markdown roundtrip | trusted |
| Obsidian | `slexkit/obsidian-slexkit` | Slex fences in local vault reading mode | trusted readonly |
| Custom Markdown host | `slexkit` | Product-specific Markdown renderer, document viewer, or Svelte site renderer | trusted or secure |

Use the packaged plugins when the host is Streamdown or Tiptap. Use the separate [SlexKit plugin repository](https://github.com/slexkit/obsidian-slexkit) for Obsidian installs and releases. Use `createSlexKitMarkdownRuntimeHost` directly for custom Markdown renderers.

Package exports and install combinations are listed in [Packages](/docs/reference/packages).

## Runnable Examples

The repository includes browser-openable examples for the packaged adapters. Both examples use the same RC low-pass Markdown source so host behavior is easy to compare:

- [Streamdown Host Adapter](/examples/streamdown-host) mirrors `examples/streamdown`.
- [Tiptap Editor Adapter](/examples/tiptap-host) mirrors `examples/tiptap`.

## Svelte Markdown Host

The SlexKit website uses a custom Markdown renderer inside a Svelte app. There is no separate Svelte Markdown adapter package. When an app owns Markdown parsing, hand each `slex` code block to SlexKit like this:

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

Use this pattern when the product owns the Markdown parser, Svelte component tree, or document shell. The integration should detect only `slex` fences, keep ordinary code blocks as code, pass a stable `artifactId`, and call cleanup when the rendered document unmounts.

## Streamdown

Install the runtime, theme, plugin, and React peer dependencies:

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom
```

Import styles once in the app entry:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/streamdown/style.css";
```

Register the renderer with Streamdown:

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

The default renderer handles only `slex` fences. Ordinary code blocks pass through to Streamdown.

## Tiptap

Install the runtime, theme, adapter, and Tiptap peer dependencies:

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown
```

Import styles once in the app entry:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";
```

Register the adapter instead of StarterKit's default code block:

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

The adapter extends Tiptap's `CodeBlock`, only takes over blocks whose language is exactly `slex`, and leaves ordinary code blocks as editable source. Blocks in one editor share an artifact runtime, so state-only fences can seed later renderable fences. It defaults to trusted runtime mode; use a secure web host for untrusted Markdown.

## Streamdown Options

Use `createSlexKitRenderer` when the host needs explicit domain scoping, source controls, playground mode, or secure mode:

```tsx
import { createSlexKitRenderer } from "@slexkit/streamdown";

const renderer = createSlexKitRenderer({
  domain: "chat-thread-42",
  showChrome: false,
  showSource: false,
  runtime: "trusted"
});
```

State-only fences in the same `domain` can seed later layout fences:

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

For unreviewed user input, third-party Markdown, or direct agent output, switch to secure mode and configure a host policy:

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

The secure runtime deployment checklist lives in [Secure Runtime Setup](security-runtime). Exact policy fields live in the [Security Runtime Contract](/docs/reference/security).

## Obsidian

> For Obsidian plugin installation only, the developer integration material above is unnecessary. Search for **SlexKit** in Obsidian **Community plugins**, then install and enable it.

The Obsidian plugin targets local vault content. It registers a `slex` code block processor in reading mode, renders the fence as a readonly interactive fragment, and does not write output back to notes.

Install the plugin from Obsidian Community Plugins:

1. Open **Settings -> Community plugins**.
2. Disable **Restricted mode** if needed.
3. Search for **SlexKit**.
4. Install and enable the plugin.

Community plugin metadata marks the release as desktop-only and compatible with Obsidian 1.5.0+.

BRAT and manual release assets remain useful for testing unreleased builds:

```text
BRAT repository: https://github.com/slexkit/obsidian-slexkit
```

Manual installs copy the GitHub release assets into the vault:

```text
.obsidian/plugins/slexkit/
  main.js
  manifest.json
  styles.css
```

Enable **SlexKit** in Obsidian's community plugin settings.

## Obsidian Example

Write an explicit `slex` fence in a note:

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

Blocks in the same note share one Markdown artifact runtime, so a state-only fence can affect a later renderable fence.

## Obsidian Boundary

The official plugin is a trusted readonly adapter. Content comes from the user's local vault; the plugin is not a sandbox for third-party Markdown or agent output.

For untrusted content, use secure mode in a web host with an explicit sandbox frame and host policy.

## Integration Checklist

- Process only fences whose language is exactly `slex`
- Keep Markdown fallback for environments without SlexKit
- Use a stable artifact/domain for each document, message, or note
- Call cleanup when a container unmounts; dispose the artifact when the document is destroyed
- Use secure mode for untrusted content instead of trusted mode
- Link API, lifecycle, package, and security details to the reference pages instead of duplicating them in host guides
