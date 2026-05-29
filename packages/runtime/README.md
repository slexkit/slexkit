# @slexkit/runtime

Component-free SlexKit runtime entry.

This package re-exports `slexkit/runtime`; it is not a standalone physical runtime package yet. Install `slexkit` alongside it.

## Install

```sh
npm install slexkit @slexkit/runtime
```

## Usage

```js
import { mount, register, attachComponentDisposer } from "@slexkit/runtime";
```

Use this entry when you want to register your own components instead of using the bundled Svelte components. The full Svelte component set is available via `@slexkit/components-svelte`.

## What's included

All core engine APIs without component registrations:

- **Mount & lifecycle**: `mount`, `ingest`, `boot`, `disposeNamespace`
- **Component registry**: `register`, `getRenderer`, `attachComponentDisposer`
- **Secure runtime**: `mountSecureArtifact`, `createSecureRuntime`, `setSlexKitRuntimeUrl`, `getSlexKitRuntimeUrl`
- **Markdown hosting**: `createSlexKitMarkdownRuntimeHost`, `getSlexKitMarkdownRuntimeHost`, `installSlexKitMarkdownRuntimeHost`
- **Diagnostics**: `parseSlexSource`, `diagnoseSlexKitSource`, `formatSlexKitDiagnostic`
- **Error types**: `SlexKitSyntaxError`, `SlexKitRuntimeError`

Note: the runtime entry does **not** auto-register any components. You must register your own renderers or import `@slexkit/components-svelte` for the official Svelte component set.

## With custom components

```js
import { mount, register, attachComponentDisposer } from "@slexkit/runtime";

register("text", (props, name, ctx) => {
  const el = document.createElement("span");
  el.textContent = props.text ?? "";
  return el;
}, { state: "none" });

mount({
  namespace: "demo",
  g: {},
  layout: { "text:hello": { text: "Hello, World!" } },
}, document.getElementById("app"));
```

## Documentation

- [SlexKit Runtime model](https://github.com/slexkit/slexkit/blob/main/site/content/reference/runtime/en-US.md)
- [Usage guide](https://github.com/slexkit/slexkit/blob/main/site/content/reference/usage/en-US.md)
- [Package boundaries](https://github.com/slexkit/slexkit/blob/main/site/content/reference/packages/en-US.md)
