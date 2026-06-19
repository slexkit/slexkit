---
title: Integration
category: Guides
status: ready
order: 25
summary: "Plugin setup guide for Streamdown and Obsidian hosts that render explicit Slex fences."
slexkitRenderMode: component
---

# Integration

SlexKit ships the Streamdown package in this repository and maintains the official Obsidian plugin in a separate release repository. Both integrations process only explicit `slex` fences — they don't scan ordinary JavaScript, JSON, or unlabeled code blocks. For the full API and host contract, see the [Host Integration reference](/docs/reference/integration).

## Plugin Selection

| Host | Package | Use case | Runtime boundary |
|---|---|---|---|
| React / Streamdown | `@slexkit/streamdown` | Chat messages, AI output, React Markdown pages | trusted or secure |
| Obsidian | `slexkit/obsidian-slexkit` | Slex fences in local vault reading mode | trusted readonly |
| Custom Markdown host | `slexkit` | Product-specific Markdown renderer or document viewer | trusted or secure |

Use the packaged plugin when the host is Streamdown. Use the separate [SlexKit plugin repository](https://github.com/slexkit/obsidian-slexkit) for Obsidian installs and releases. Use `createSlexKitMarkdownRuntimeHost` directly for custom Markdown renderers.

Package installation details and release boundaries are tracked in [Package Boundaries](/docs/reference/packages).

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

The Obsidian plugin targets local vault content. It registers a `slex` code block processor in reading mode, renders the fence as a readonly interactive fragment, and does not write output back to notes.

Install the plugin from Community Plugins once it is listed, or use BRAT/manual release assets before listing:

```text
BRAT repository: https://github.com/slexkit/obsidian-slexkit
```

Manual installs copy release assets into the vault:

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
