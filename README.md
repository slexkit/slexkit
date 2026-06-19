<div align="center">
  <p>
    <img src="site/assets/logo.svg" alt="SlexKit" width="84" height="84" />
  </p>
  <h1>SlexKit</h1>
  <p><strong>Streaming Live EXpressions Kit</strong></p>
  <p>
    "Docs as tools, tools as docs." Give Markdown interactive power and make every AI output come alive.
  </p>
  <p>
    <a href="site/content/guides/intro/en-US.md">Documentation</a> ·
    <a href="site/content/components/accordion/en-US.md">Components</a> ·
    <a href="site/content/reference/spec/en-US.md">Specification</a> ·
    <a href="site/content/guides/ai-agents/en-US.md">AI / Agents</a> ·
    <a href="README.zh-CN.md">简体中文</a>
  </p>
  <p>
    <img alt="version" src="https://img.shields.io/badge/version-0.2.0-18181b">
    <img alt="script" src="https://img.shields.io/badge/Slex-v0.1-18181b">
    <img alt="TypeScript" src="https://img.shields.io/badge/runtime-TypeScript-3178c6">
    <img alt="Svelte 5" src="https://img.shields.io/badge/components-Svelte_5-ff3e00">
    <img alt="license" src="https://img.shields.io/badge/license-MIT-16a34a">
  </p>
</div>

## Live interface blocks inside Markdown

**SlexKit** turns explicit `slex` Markdown fences into live, stateful UI blocks. A Slex source is just a JavaScript object literal: `g` holds state and logic, `layout` describes the component tree, and the browser runtime renders the result in place.

It is built for chat messages, documents, agent panels, tool results, and AI-authored dashboards. It is not a full application framework.

## Installation

```sh
npm install slexkit
```

```ts
import { mount } from "slexkit";
import "slexkit/style.css";
```

## Usage

```html
<div id="app"></div>

<script type="module">
  import { mount } from "slexkit";
  import "slexkit/style.css";

  mount(
    {
      slex: "0.1",
      namespace: "hello",
      g: { name: "World", count: 0 },
      layout: {
        "card:greeting": {
          title: "Greeting",
          "text:message": {
            "$text": "'Hello, ' + g.name + '! Count: ' + g.count"
          },
          "button:add": {
            label: "+1",
            onclick: "g.count++"
          }
        }
      }
    },
    document.getElementById("app")
  );
</script>
```

## Markdown Native

SlexKit-capable hosts process explicit `slex` fences only. Plain `js`, `json`, and unlabeled code blocks stay inert.

````md
```slex
{
  slex: "0.1",
  namespace: "status",
  g: { done: 3, total: 4 },
  layout: {
    "badge:state": { label: "Ready", tone: "success" },
    "text:summary": { "$text": "g.done + '/' + g.total + ' complete'" }
  }
}
```

**Status:** Ready. 3/4 complete.
````

Markdown platforms without SlexKit support show the fallback text. Hosts with SlexKit render the interactive UI.

## What You Get

- **Zero-build Slex source**: object literals with no imports, scaffolding, or component bundling in the generated output.
- **Reactive `g` / `layout` model**: centralized state and logic with declarative component trees.
- **Expression pipes**: `$` read expressions for dynamic props and `on*` write expressions for events.
- **Directives**: `$if` and `$for` for conditional rendering and keyed list reconciliation.
- **Official Svelte components**: 40+ layout, input, content, display, disclosure, feedback, and tooling components.
- **Extensible registry**: custom component types, Svelte renderers, and component state modes.
- **Trusted and secure runtimes**: host-realm rendering for trusted content, sandbox iframe rendering for untrusted source.
- **ToolHost**: confirm, choose, and fill-form templates for structured AI tool-call UX.
- **AI-friendly docs surface**: `llms.txt`, skills, and the `@slexkit/mcp` read-only MCP server.

## Packages

| Package | Install | Contents |
| --- | --- | --- |
| `slexkit` | `npm install slexkit` | Runtime, Svelte components, ToolHost, styles |
| `@slexkit/runtime` | `npm install slexkit @slexkit/runtime` | Component-free runtime wrapper |
| `@slexkit/components-svelte` | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` | Svelte component registration |
| `@slexkit/theme-shadcn` | `npm install @slexkit/theme-shadcn` | CSS theme tokens |
| `@slexkit/streamdown` | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` | React / Streamdown Markdown renderer |
| `@slexkit/mcp` | `npx -y @slexkit/mcp` | Read-only MCP server for docs, examples, and source validation |

See [Package Boundaries](site/content/reference/packages/en-US.md) for details.

## Integrations

| Host | Path |
| --- | --- |
| Browser DOM | `mount()`, `ingest()`, `boot()`, `disposeNamespace()` |
| Markdown renderers | `createSlexKitMarkdownRuntimeHost()` |
| React / Streamdown | `@slexkit/streamdown` |
| Obsidian | Official plugin repo: <https://github.com/slexkit/obsidian-slexkit> |
| AI agents | `@slexkit/mcp`, `llms.txt`, SlexKit skill docs |
| Custom components | `register()`, `registerSvelteComponent()`, `registerSubset()` |

## Security Runtime

Trusted mode runs inside the host realm and is intended for application-authored or reviewed source. Secure mode isolates untrusted Slex source in a sandbox iframe with an opaque origin, nonce-based CSP, locked-down globals, host-mediated network access, and a heartbeat watchdog.

Read the [Security Runtime](site/content/reference/security/en-US.md) docs before rendering unreviewed user or model output.

## Documentation

| Document | Topic |
| --- | --- |
| [Getting Started](site/content/guides/quick-start/en-US.md) | Install and render a first Markdown-friendly Slex source |
| [Integration](site/content/guides/integration/en-US.md) | Streamdown, Obsidian, and custom host paths |
| [Runtime model](site/content/reference/runtime/en-US.md) | Mounting, updates, namespace store, lifecycle |
| [Slex usage reference](site/content/reference/usage/en-US.md) | Source structure, directives, expressions, events, custom components |
| [Security runtime](site/content/reference/security/en-US.md) | Threat model, sandbox iframe, policy, postMessage bridge |
| [Slex Specification](site/content/reference/spec/en-US.md) | Protocol v0.1, types, merge rules, lifecycle hooks |
| [ToolHost](site/content/reference/toolhost/en-US.md) | Tool-call rendering and custom templates |
| [Icon system](site/content/reference/icons/en-US.md) | Phosphor icons, custom registration, Iconify fallback |
| [AI / Agents](site/content/guides/ai-agents/en-US.md) | `llms.txt`, MCP server, skills, and authoring rules |
| [Changelog](CHANGELOG.md) | Release notes and notable changes |

## Version Information

```ts
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION, getSlexKitInfo } from "slexkit";
```

The npm package version, component implementation version, and Slex protocol version are exposed separately. The current public protocol is `v0.1`.

## License

MIT
