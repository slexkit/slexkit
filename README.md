# SlexKit

Streaming Live EXpressions Kit is an HTML-first runtime for interactive Markdown. A `slex` fence contains a standard HTML fragment, optional CSS, `slex-*` custom elements, and optional inline module scripts. Hosts render generated code in an isolated frame by default.

## Authoring

````markdown
```slex
<slex-card title="Counter">
  <slex-stat id="count" label="Count" value="0"></slex-stat>
  <slex-button id="add" label="Add"></slex-button>
</slex-card>
<script type="module">
  const count = slex.root.querySelector("#count");
  const add = slex.root.querySelector("#add");
  const increment = () => { count.value = Number(count.value) + 1; };
  add.addEventListener("click", increment);
  slex.onDispose(() => add.removeEventListener("click", increment));
</script>
```
````

The format has no object `g/layout` envelope, expression-string attributes, binding grammar, or old-format fallback. Use native DOM properties and events. Component registration, approved APIs, runtime URLs, and styles are host responsibilities—not AI payload.

The sandbox exposes a small global SDK:

- `slex.root`
- `slex.signal` (`AbortSignal`, aborted when the module scope is disposed)
- `slex.onDispose(fn)`
- `slex.onSnapshot(fn)` and `slex.onRestore(fn)`
- policy-gated `slex.api`
- artifact-local `slex.shared.get/set/subscribe`

## Supported custom elements

The current `slexkit/web-components` contract contains these 28 default elements:

`slex-column`, `slex-card`, `slex-grid`, `slex-row`, `slex-input`, `slex-slider`, `slex-checkbox`, `slex-switch`, `slex-button`, `slex-stat`, `slex-text`, `slex-progress`, `slex-badge`, `slex-code-block`, `slex-divider`, `slex-link`, `slex-table`, `slex-select`, `slex-radio-group`, `slex-tabs`, `slex-accordion`, `slex-collapsible`, `slex-formula`, `slex-callout`, `slex-section`, `slex-step`, `slex-toast`, and `slex-submit`.

Use ordinary HTML for unsupported UI. See [docs/web-components.md](docs/web-components.md) and the generated `dist/custom-elements.json` for exact attributes, properties, events, and slots.

The optional 29th catalog item, `slex-playground`, is registered explicitly from `slexkit/tooling` with `defineSlexPlayground(window, hostOptions)`. It uses the same isolated host and requires host-owned runtime/style asset configuration. The root entry exposes `defineSlexElements` for standalone components; it does not export raw Svelte component sources.

## Host integration

```js
import { createSlexKitMarkdownRuntimeHost } from "slexkit/runtime";

const host = createSlexKitMarkdownRuntimeHost({
  secureFrame: {
    runtimeUrl: new URL("./slexkit.runtime.js", import.meta.url).href,
    styleUrl: new URL("./slexkit.css", import.meta.url).href,
  },
});

await host.updateArtifact("message-42", [{
  artifactId: "message-42",
  blockId: "block-1",
  source: '<slex-text text="Ready"></slex-text>',
  container: document.querySelector("#preview"),
}], { phase: "commit" });
```

Preview updates validate source without executing it. Commit updates run inside the isolated document. Stable block IDs plus element `id` or `data-key` allow the runtime to preserve compatible DOM/component instances and visible control values. Missing frame runtime assets fail closed.

For a direct document mount:

```js
import { mount } from "slexkit";

const handle = mount("<p>Hello</p>", document.querySelector("#app"), {
  secureFrame: { runtimeUrl: "/assets/slexkit.runtime.js" },
});
await handle.ready;
```

## Static inspection

`inspectSlexSource(source)`, `parseSlexSource(source)`, and `validateSlexSource(source)` inspect HTML and inline JavaScript without executing scripts. Object input is rejected. Static inspection blocks external scripts/imports, inline event-handler attributes, embedded browsing/plugin content, navigation metadata, and executable URL schemes; it is a guardrail, not a security boundary.

## Development

```sh
bun install
bun run build
bun test
bun run dev
```

Useful package entries:

- `slexkit` and `slexkit/runtime`: HTML document runtime and host APIs
- `slexkit/web-components`: standalone custom elements
- `slexkit/custom-elements.json`: editor/tooling metadata
- `@slexkit/mcp`: read-only docs, examples, component metadata, and static validation

See [the HTML migration contract](docs/html-migration-contract.md), [theme contract](docs/theme-contract.md), [examples](examples/README.md), and the bilingual documentation site under `site/content/`.

## Security boundary

Generated JavaScript must run in the isolated frame. Shadow DOM is not a sandbox. The frame policy denies payload fetch/image/font/external script/link resource loads in supported browsers, and approved requests use the host bridge. This is not a universal egress firewall: iframe self-navigation can still issue a request. The runtime does not provide CPU preemption; hostile execution requires external browser/process network controls and timeouts.

## License

MIT
