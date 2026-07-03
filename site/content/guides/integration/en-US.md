---
title: Integration
category: Guides
status: ready
order: 25
summary: "Connect SlexKit to assistant-ui, Streamdown, Tiptap, Obsidian, or a custom Markdown renderer."
slexkitRenderMode: component
---

# Integration

Choose the right SlexKit host integration by matching where Markdown is rendered. Every integration renders only fenced code blocks whose language is `slex`; ordinary `js`, `json`, and unlabeled code blocks stay with the host Markdown renderer.

For the full host API, see the [Host Integration reference](/docs/reference/integration).

## Choose An Integration

| Host | Install or enable | Render target | Default mode |
|---|---|---|---|
| assistant-ui | `@slexkit/assistant-ui` | text message parts | secure |
| React / Streamdown | `@slexkit/streamdown` | chat messages and React Markdown pages | trusted or secure |
| Tiptap | `@slexkit/tiptap` | `slex` code block previews in an editor | trusted |
| Obsidian | **SlexKit** from Community Plugins | local notes in reading mode | trusted readonly |
| Custom Markdown host | `slexkit` | product docs, document viewers, site renderers | trusted or secure |

assistant-ui, Streamdown, and Tiptap have ready-made packages. Custom Markdown renderers can use `createSlexKitMarkdownRuntimeHost` directly. The Obsidian plugin can be installed from Community Plugins; use the [plugin repository](https://github.com/slexkit/obsidian-slexkit) only when testing unreleased builds.

Package exports and install combinations are listed in [Packages](/docs/reference/packages).

## Runnable Examples

Runnable examples show the integration behavior before app wiring. Streamdown and Tiptap use the same RC low-pass Markdown source, so read-only rendering and editor preview can be compared directly:

- [Streamdown Host Adapter](/examples/streamdown-host) mirrors `examples/streamdown`.
- [Tiptap Editor Adapter](/examples/tiptap-host) mirrors `examples/tiptap`.
- [assistant-ui Adapter](/examples/assistant-ui-host) mirrors `examples/assistant-ui`.

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

Use this pattern when the product owns the Markdown parser, Svelte component tree, or document shell. Keep three rules in place: detect only `slex` fences, pass a stable `artifactId` for the document, and call cleanup when the rendered document unmounts.

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

This renderer only replaces `slex` code blocks. Other code blocks stay with Streamdown.

## assistant-ui

When an assistant-ui app already renders text through `@assistant-ui/react-streamdown`, use the SlexKit wrapper for message text parts:

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom
```

Import styles once in the app entry:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/assistant-ui/style.css";
```

Use the wrapper where assistant-ui renders text message parts:

```tsx
import { MessagePrimitive } from "@assistant-ui/react";
import { SlexKitAssistantStreamdownText } from "@slexkit/assistant-ui";

export function AssistantMessage() {
  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.Parts>
        {({ part }) =>
          part.type === "text" ? (
            <SlexKitAssistantStreamdownText
              artifactId="message-1"
              runtime="secure"
              secureFrame={{ runtimeUrl: "/slexkit.runtime.js" }}
            />
          ) : null
        }
      </MessagePrimitive.Parts>
    </MessagePrimitive.Root>
  );
}
```

The wrapper only replaces the `slex` language block. Threads, composer state, message state, tool calls, approvals, and form submissions stay with the existing assistant-ui or ToolHost layer.

## Tiptap

Install the SlexKit adapter, theme, and Tiptap dependencies:

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown
```

Import styles once in the app entry:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";
```

Disable StarterKit's default code block, then register the SlexKit extension:

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

The extension only takes over code blocks whose language is exactly `slex`. Other code blocks remain normal editable Tiptap code blocks.

All `slex` blocks in one editor share state: a state-only block can seed a later layout block. The Tiptap integration uses trusted mode by default; render unreviewed user Markdown or third-party content in a secure web host instead.

## Streamdown Options

Use `createSlexKitRenderer` to set the message/domain, hide source, enable playground behavior, or switch to secure mode:

```tsx
import { createSlexKitRenderer } from "@slexkit/streamdown";

const renderer = createSlexKitRenderer({
  domain: "chat-thread-42",
  showChrome: false,
  showSource: false,
  runtime: "trusted"
});
```

Inside the same `domain`, an earlier state-only block can provide data for a later layout block:

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

For unreviewed user input, third-party Markdown, or direct agent output, switch to secure mode:

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

Use [Secure Runtime Setup](security-runtime) and the [Security Runtime Contract](/docs/reference/security) when deploying the sandbox iframe, runtime file, and policy fields.

## Obsidian

> For Obsidian plugin installation only, the developer integration material above is unnecessary. Search for **SlexKit** in Obsidian **Community plugins**, then install and enable it.

The Obsidian plugin renders `slex` code blocks from your local vault in reading mode. It does not write rendered output back to notes.

Install the plugin from Obsidian Community Plugins:

1. Open **Settings -> Community plugins**.
2. Disable **Restricted mode** if needed.
3. Search for **SlexKit**.
4. Install and enable the plugin.

The community plugin is marked desktop-only and compatible with Obsidian 1.5.0+.

To test an unreleased build, use BRAT:

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

`slex` code blocks in the same note share state, so an earlier state block can affect a later rendered block.

## Obsidian Security Notes

The official plugin treats local vault content as trusted. It is not a sandbox for third-party Markdown or direct agent output.

For untrusted content, use secure mode in a web host with a sandbox frame and host policy.

## Before You Ship

- Process only fences whose language is exactly `slex`
- Keep Markdown fallback for environments without SlexKit
- Use a stable artifact/domain for each document, message, or note
- Call cleanup when a container unmounts; dispose the artifact when the document is destroyed
- Use secure mode for untrusted content instead of trusted mode
