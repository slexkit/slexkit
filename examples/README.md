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
| `basic-resistor` | Trusted `mount()`, `g` methods, component instance state, input/stat/grid, reset action |
| `component-gallery` | Built-in components, including custom select listbox, tabs, switch, slider, checkbox, radio group, accordion, toast, progress |
| `markdown-fence` | `slex` fence payloads, state-only block, artifact-scoped trusted Markdown runtime |
| `secure-fetch` | `mountSecureArtifact()`, sandbox iframe runtime URL, host network policy, `api.fetch` allow and deny paths |
| `toolhost` | `renderToolCall()` with confirm, choose-options, fill-form, submitted and ignored results |
| `custom-component` | `register()`, vanilla renderer, `attachComponentDisposer()`, root cleanup, `disposeNamespace()` |

## Notes

- Examples import from `/dist/slexkit.js` and `/dist/slexkit.css`, so run
  `bun run build:core` after changing runtime or component source.
- The source snippets use English UI copy by default. A small amount of Chinese
  text is kept in `basic-resistor` to verify Unicode content handling.
- `secure-fetch` uses a fake host adapter response. It demonstrates policy and
  capability flow without making a real network request.
