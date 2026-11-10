# SlexKit examples

These repository examples exercise HTML-first authoring and host integration. They are not published as package files.

```sh
bun install
bun run build:core
bun examples/dev-server.mjs basic-resistor
```

| Example | Purpose |
| --- | --- |
| `web-components` | Standalone custom elements, native events, reset, themes, and table array properties |
| `minimal-cdn` | No-build host shell with host-owned runtime/style URLs |
| `basic-resistor` | `mount(source, container)` with an HTML payload and inline module algorithm |
| `component-gallery` | Supported custom elements plus native HTML alternatives |
| `markdown-fence` | Stable block IDs and `updateArtifact()` preview/commit lifecycle |
| `assistant-ui` | HTML `slex` fence inside an assistant-ui text part |
| `streamdown` | Streamdown renderer using the shared HTML-first Markdown fixture |
| `tiptap` | Tiptap node view using the shared HTML-first Markdown fixture |
| `secure-fetch` | Policy-gated `slex.api.fetch` in an isolated frame |
| `toolhost` | Structured tool-call UI, which remains separate from ordinary `slex` authoring |
| `custom-component` | Application-authored standard custom element lifecycle |

Generated payloads never register components, choose runtime/style URLs, or import code. Those are host responsibilities. The document runtime must fail closed when its frame runtime cannot load. The adapter examples require their package builds; run `bun run build` before checking all examples.
