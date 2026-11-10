---
title: "Formula"
category: Display
status: ready
order: 11
summary: "Reactive KaTeX formula display."
---

# Formula

Renders a TeX formula from `tex`; `display-mode` selects block rather than inline presentation.

## HTML example

```slex
<slex-formula></slex-formula>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `tex` | string | `""` | TeX source; empty input renders a harmless spacing formula. |
| `displayMode` / `display-mode` | boolean | `true` | Uses KaTeX display mode by default. Assign displayMode = false for inline mode; omitting the attribute restores display mode. |

## Contract summary

- Attributes: `tex`, `display-mode`
- Properties: `tex`, `displayMode`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
