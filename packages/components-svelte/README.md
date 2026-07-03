# @slexkit/components-svelte

Official Svelte component registration for SlexKit.

This package re-exports `slexkit/components-svelte` and auto-registers all built-in components on import. It is not a standalone physical package — install `slexkit` alongside it.

## Install

```sh
npm install slexkit @slexkit/runtime @slexkit/components-svelte @slexkit/theme-shadcn
```

## Usage

```js
import { mount } from "@slexkit/runtime";
import "@slexkit/components-svelte";
import "@slexkit/theme-shadcn/style.css";

mount({
  namespace: "demo",
  g: { count: 0 },
  layout: {
    "text:label": { "$content": "'Count: ' + g.count" },
    "button:add": { text: "+1", onclick: "g.count++" },
  },
}, document.getElementById("app"));
```

The import side-effect registers all 30 built-in Svelte components into the global runtime registry.

## Component list

| Category | Components |
|----------|------------|
| **Action** | `button` |
| **Component** | `icon` |
| **Content** | `badge`, `callout`, `code-block`, `divider`, `link`, `section` |
| **Data** | `table` |
| **Disclosure** | `accordion`, `collapsible` |
| **Display** | `formula`, `stat`, `text` |
| **Feedback** | `progress`, `toast` |
| **Input** | `checkbox`, `input`, `radio-group`, `select`, `slider`, `switch` |
| **Layout** | `card`, `column`, `grid`, `row` |
| **Navigation** | `tabs` |
| **Tooling** | `playground`, `step`, `submit` |

All components support the shadcn/ui design token theme when using `@slexkit/theme-shadcn`. Components also support Phosphor Icons and custom icon registration via the icon system API.

## Manual registration

For a subset, import and register manually:

```js
import { mount, register, getRenderer } from "@slexkit/runtime";
import { registerSubset } from "@slexkit/components-svelte";

// Register only layout and display components
registerSubset(["column", "row", "grid", "card", "text", "stat"]);
```

Add a custom component alongside the built-ins:

```js
import { registerSvelteComponent } from "@slexkit/components-svelte";
import MyComponent from "./MyComponent.svelte";

registerSvelteComponent("my-component", MyComponent, { state: "value" });
```

## Theming

```js
import "@slexkit/theme-shadcn/style.css";     // theme + all components
import "@slexkit/theme-shadcn/base.css";       // theme only (no component styles)
import "@slexkit/theme-shadcn/components/button.css"; // individual component
```

## Documentation

- [SlexKit Components docs](https://slexkit.pages.dev/docs/components/accordion)
- [Icon system](https://github.com/slexkit/slexkit/blob/main/site/content/reference/icons/en-US.md)
- [Packages](https://github.com/slexkit/slexkit/blob/main/site/content/reference/packages/en-US.md)
