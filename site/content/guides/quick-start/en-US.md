---
title: Getting Started
category: Guides
status: ready
order: 20
summary: "Install SlexKit, mount a first fragment, and keep readable Markdown fallback."
slexkitRenderMode: component
---

# Getting Started

> For Obsidian plugin installation, open **Settings -> Community plugins**, search for **SlexKit**, then install and enable it. The npm package path below targets web apps, Markdown hosts, Streamdown, and custom runtimes.

Start by installing `slexkit` and mounting a trusted fragment. Once basic rendering works, move on to Markdown hosts, Streamdown, or the Obsidian plugin.

## Installation Entry

For most apps, start by installing the root package:

```sh
npm install slexkit
```

```ts
import { mount } from "slexkit";
import "slexkit/style.css";
```

For host-specific packages, choose by scenario:

| Use case | Install |
|---|---|
| Custom components or component-free runtime | `npm install slexkit @slexkit/runtime` |
| Official Svelte component registration | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| Standalone shadcn-token theme CSS | `npm install @slexkit/theme-shadcn` |
| React + Streamdown Markdown host | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| Obsidian vault rendering | Install **SlexKit** from Obsidian Community Plugins |

`@slexkit/runtime` and `@slexkit/components-svelte` wrap the root package; they are not independent implementations.

## Trusted Fragment

Start with trusted mode for application-authored source, local examples, repository examples, and reviewed snippets.

```ts
import { mount } from "slexkit";
import "slexkit/style.css";

const source = {
  namespace: "getting_started_counter",
  g: {
    count: 0
  },
  layout: {
    "card:demo": {
      title: "Counter",
      "text:value": {
        "$text": "'Count: ' + g.count"
      },
      "button:add": {
        label: "+1",
        onclick: "g.count++"
      }
    }
  }
};

const cleanup = mount(source, document.getElementById("app")!);
```

Call `cleanup()` when removing containers, replacing messages, or unloading pages. If the namespace won't be reused, call `disposeNamespace(namespace)`.

## Markdown Fallback

When source appears in Markdown, handle only explicit `slex` fences and keep readable fallback text after the fence:

````md
```slex
{
  namespace: "release_status",
  layout: {
    "badge:status": { label: "Ready", tone: "success" },
    "text:summary": { text: "3 of 3 checks passed." }
  }
}
```

**Release status:** Ready. 3 of 3 checks passed.
````

SlexKit-capable hosts render the fence. Plain Markdown hosts show the fallback. Do not infer executable SlexKit source from `js`, `json`, or unlabeled code blocks.

## Markdown Host

For chat messages, docs pages, or long Markdown content, use `createSlexKitMarkdownRuntimeHost`. It lets multiple `slex` blocks in one document share state and provides one place for cleanup and trusted/secure mode selection.

```ts
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import "slexkit/style.css";

const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",
  theme: "host-shadcn"
});

export function mountSlexFence(source: string, container: HTMLElement) {
  return runtime.mountBlock({
    artifactId: "message-42",
    source,
    container
  });
}
```

When the whole document or message thread is destroyed, call `runtime.disposeArtifact(artifactId)` or `runtime.disposeAll()`.

## Content Source

| Content source | Use |
|---|---|
| App-generated source, repository examples, local vault content | trusted |
| Unreviewed user input, third-party Markdown, direct agent output | secure |

Secure mode requires a sandbox iframe, a publicly served `slexkit.runtime.js`, and a host policy. See [Secure Runtime Setup](security-runtime).

## Keep Reading

- [Integration](integration): React/Streamdown and Obsidian plugins
- [Secure Runtime Setup](security-runtime): untrusted or agent-generated content
- [Component Reference](../components/card): built-in component catalog
- [AI / Agents](ai-agents): SlexKit authoring context for models and agents
