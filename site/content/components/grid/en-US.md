---
title: "Grid"
category: Layout
status: ready
order: 40
summary: "Responsive equal-width grid for sibling cards, metrics, and field groups."
---

# Grid

Arranges slotted children in a responsive grid controlled by column counts and gap properties.

## HTML example

```slex
<slex-grid></slex-grid>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | string / number | `1` | Base column count. The grid is forced to one column below 640px of isolated-document width. |
| `smColumns` / `sm-columns` | string / number | unset | Column count from 640px isolated-document width. |
| `mdColumns` / `md-columns` | string / number | `auto` | Column count from 768px isolated-document width; falls back to columns. |
| `lgColumns` / `lg-columns` | string / number | unset | Column count from 1024px isolated-document width. |
| `xlColumns` / `xl-columns` | string / number | unset | Column count from 1280px isolated-document width. |
| `gap` | string | `1rem` | CSS length used as the grid gap; unitless token integers are not supported. |

Slots: default slot accepting ordinary HTML or custom elements.

## Contract summary

- Attributes: `columns`, `sm-columns`, `md-columns`, `lg-columns`, `xl-columns`, `gap`
- Properties: `columns`, `smColumns`, `mdColumns`, `lgColumns`, `xlColumns`, `gap`
- Events: none
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
