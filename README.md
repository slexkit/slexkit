# SlexKit

[**简体中文**](README.zh-CN.md) | **English**

Zero-build, Markdown-friendly reactive UI runtime for AI output.

SlexKit lets language models emit a JavaScript object literal -state and logic in `g`, component tree in `layout` -which the browser-side runtime renders as interactive UI. It targets chat messages, documents, agent panels, and tool dashboards -not full applications.

## Features

- **JS object literal Slex source** -no build step, no imports, no project scaffolding
- **Reactive `g`/`layout` split** -state and logic centralized in `g`, UI structure in `layout`
- **`$if` / `$for` directives** -conditional rendering and array iteration with keyed reconciliation
- **Expression pipes** -`$` read-pipes and `on*` write-pipes for dynamic props and event handling
- **Component registry** -extensible component types with state modes (`value`/`checked`/`enabled`/`readable`/`none`)
- **Trusted + secure dual runtime** -trusted mode runs in the host realm; secure mode isolates untrusted Slex source in a sandbox iframe
- **CSP-hardened sandbox** -opaque origin, nonce-based CSP, locked-down globals, heartbeat watchdog
- **Official Svelte components** -40+ ready-to-use components (input, navigation, layout, feedback, content, disclosure, display, tooling)
- **ToolHost** -structured user input collection (confirm, choose, fill form) with submit boundaries
- **MCP server** -`@slexkit/mcp` provides AI agents with docs, examples, and source validation via Model Context Protocol
- **Markdown fence native** -host detects `slex` fences explicitly; never guesses code blocks
- **Framework integrations** -React/Streamdown renderer, Obsidian adapter

## Quick start

```sh
npm install slexkit
```

```html
<div id="app"></div>

<script type="module">
  import { mount } from "slexkit";

  mount(
    {
      slex: "0.1",
      namespace: "hello",
      g: { name: "World" },
      layout: {
        "card:greeting": {
          title: "Greeting",
          "text:message": {
            "$content": "'Hello, ' + g.name + '!'"
          }
        }
      }
    },
    document.getElementById("app")
  );
</script>
```

## Markdown output

SlexKit-capable hosts process explicit `slex` fences only -never plain JavaScript or JSON code blocks.

~~~~md
```slex
{
  slex: "0.1",
  namespace: "status",
  g: { done: 3, total: 4 },
  layout: {
    "text:summary": { "$content": "g.done + '/' + g.total + ' complete'" }
  }
}
```

**Status:** 3/4 complete
~~~~

Platforms without SlexKit support render the fallback text. Hosts with SlexKit render the interactive UI.

## Installation

```sh
npm install slexkit
```

For more granular imports:

| Package | Install | Contents |
|---------|---------|----------|
| `slexkit` | `npm install slexkit` | Runtime + Svelte components + ToolHost + styles |
| `@slexkit/runtime` | `npm install slexkit @slexkit/runtime` | Component-free runtime (thin wrapper) |
| `@slexkit/components-svelte` | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` | Svelte component registration |
| `@slexkit/theme-shadcn` | `npm install @slexkit/theme-shadcn` | CSS theme |
| `@slexkit/streamdown` | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` | React/Streamdown renderer |
| `@slexkit/obsidian` | `npm install slexkit @slexkit/obsidian` | Obsidian plugin adapter |
| `@slexkit/mcp` | `npx -y @slexkit/mcp` | Read-only MCP server for docs, components, and source validation |

See [Package Boundaries](site/content/reference/packages/en-US.md) for package details.

## Version information

```js
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION, getSlexKitInfo } from "slexkit";
```

The npm package version, component implementation version, and Slex protocol version are exposed separately. The current public protocol is `v0.1`; it can remain stable across multiple package releases.

## Documentation

| Document | Topic |
|----------|-------|
| [Getting Started](site/content/guides/quick-start/en-US.md) | Install and render a first Markdown-friendly Slex source |
| [Integration](site/content/guides/integration/en-US.md) | Streamdown and Obsidian host plugin paths |
| [Runtime model](site/content/reference/runtime/en-US.md) | `mount()`, `ingest()`, `boot()`, namespace store, lifecycle |
| [Slex usage reference](site/content/reference/usage/en-US.md) | Slex source structure, `$if`/`$for`, expressions, events, custom components |
| [Security runtime](site/content/reference/security/en-US.md) | Threat model, policy, sandbox iframe, postMessage bridge, fail-closed |
| [Slex Specification](site/content/reference/spec/en-US.md) | Protocol spec v0.1, types, merge rules, lifecycle hooks |
| [Design rationale](site/content/reference/rationale/en-US.md) | Why object literals, expressions, explicit fences, trusted/secure split |
| [Package boundaries](site/content/reference/packages/en-US.md) | Package relationship diagram, installation matrix |
| [Host integration](site/content/reference/integration/en-US.md) | MarkdownRuntimeHost, Streamdown, Obsidian, custom host adapters |
| [ToolHost](site/content/reference/toolhost/en-US.md) | Tool call rendering, built-in templates, custom template development |
| [Icon system](site/content/reference/icons/en-US.md) | Phosphor icons, custom registration, Iconify fallback, API reference |
| [AI / Agents](site/content/guides/ai-agents/en-US.md) | `llms.txt`, MCP server, skills, and authoring rules |
| [Changelog](CHANGELOG.md) | Release notes and notable changes |

## License

MIT
