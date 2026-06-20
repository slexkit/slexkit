# SlexKit Examples

These examples are GitHub-only integration samples. They are not shipped in the
published npm package.

## Run

```sh
bun install
bun run build:core
bun examples/dev-server.mjs basic-resistor
```

Open the printed local URL in a browser. Replace `basic-resistor` with any
example name below.

## Examples

| Example | What it demonstrates |
| --- | --- |
| `minimal-cdn` | Zero-build CDN usage: bundled CSS, ES module runtime, inline Slex source, thin host shell only |
| `basic-resistor` | Trusted `mount()`, `g` methods, component instance state, input/stat/grid, reset action |
| `component-gallery` | Built-in components, including custom select listbox, tabs, switch, slider, checkbox, radio group, accordion, toast, progress |
| `markdown-fence` | `slex` fence payloads, state-only block, artifact-scoped trusted Markdown runtime |
| `streamdown` | React/Streamdown custom renderer rendering the official RC low-pass Markdown + `slex` example |
| `tiptap` | Tiptap NodeView adapter editing the same official RC low-pass Markdown + `slex` example |
| `secure-fetch` | `mountSecureArtifact()`, sandbox iframe runtime URL, host network policy, `api.fetch` allow and deny paths |
| `toolhost` | `renderToolCall()` with confirm, choose-options, fill-form, submitted and ignored results |
| `custom-component` | `register()`, vanilla renderer, `attachComponentDisposer()`, root cleanup, `disposeNamespace()` |

## Notes

- Examples import from `/dist/slexkit.js` and `/dist/slexkit.css`, so run
  `bun run build:core` after changing runtime or component source.
- Adapter examples such as `streamdown` and `tiptap` also import their package
  builds from `/packages/<name>/dist`; run `bun run build` before checking all
  examples together.
- `minimal-cdn` is the exception: it can be opened directly from disk because it
  loads SlexKit from jsDelivr.
- `streamdown` is a framework-free host example. It loads React only because
  Streamdown's custom renderer API uses React peer dependencies.
- `streamdown` and `tiptap` intentionally load the public site's
  `site/content/examples/rc-low-pass-filter/en-US.md` through
  `examples/shared/adapter-demo.js`, so every adapter can be compared against
  the same official Markdown and `slex` source.
- The public site mirrors these runnable adapter examples as
  `/examples/streamdown-host` and `/examples/tiptap-host`; deployment should
  point developers to those pages and keep the source links on the matching
  `examples/<adapter>` directories.
- `tiptap` adds Tiptap's optional mathematics extension only in the example
  host, because the official fixture contains Markdown formulas. The
  `@slexkit/tiptap` package itself does not require math rendering peers.
- The source snippets use English UI copy by default. A small amount of Chinese
  text is kept in `basic-resistor` to verify Unicode content handling.
- `secure-fetch` uses a fake host adapter response. It demonstrates policy and
  capability flow without making a real network request.
