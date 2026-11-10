---
title: "Playground"
category: Tooling
status: ready
order: 10
summary: "Optional HTML editor and isolated preview registered explicitly from slexkit/tooling."
---

# Playground

`slex-playground` is the optional 29th catalog element. It is not registered by `defineSlexElements()` and must not be registered by generated payload code. A trusted host enables it explicitly and supplies the isolated runtime assets:

```js
import { defineSlexPlayground } from "slexkit/tooling";

defineSlexPlayground(window, {
  secureFrame: {
    runtimeUrl: "/assets/slexkit.runtime.js",
    styleUrl: "/assets/slexkit.css",
  },
});
```

The `source` string/attribute sets editor content. The boolean `autorun` attribute commits initial content; without it, initial and typing updates are preview-only until Run is selected. Preview and Run use the same isolated HTML document host as other integrations.

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | string | `""` | Editable HTML source. Assigning it updates the editor and runs a preview-phase render. |
| `autorun` | boolean | `false` | Runs the initial connected source in commit phase; later source changes still use preview phase. |

## Contract summary

- Attributes: `source`, `autorun`
- Properties: `source`, `autorun`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
