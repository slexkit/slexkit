---
title: "Code Block"
category: Content
status: ready
order: 50
summary: "Code or configuration snippet display."
---

# Code Block

Renders code or preformatted content with an optional language and title; it is display content, not an executable script surface.

## HTML example

```slex
<slex-code-block title="example.js" language="javascript" code="const answer = 42;"></slex-code-block>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | string | `""` | Primary code source. |
| `content` | string | `""` | Alternate source field; the light-DOM-derived code takes precedence. Prefer code or element text. |
| `language` | string | `""` | Language label and syntax-highlighting hint; unsupported names render plain code. |
| `title` | string | `""` | Optional caption title. |

## Contract summary

- Attributes: `code`, `content`, `language`, `title`
- Properties: `code`, `content`, `language`, `title`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
