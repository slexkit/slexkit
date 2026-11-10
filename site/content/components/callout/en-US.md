---
title: "Callout"
category: Content
status: ready
order: 40
summary: "Highlighted contextual message for notes, warnings, and tips."
---

# Callout

Highlights titled explanatory or warning content with tone and icon options; slotted children supply rich body content.

## HTML example

```slex
<slex-callout></slex-callout>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | `""` | Optional callout heading. |
| `content` | string | `""` | Primary body text, rendered alongside default-slot children. |
| `description` | string | `""` | Fallback body text used when content is unset. |
| `tone` | string | `info` | Semantic tone; error and destructive normalize to danger. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |

Slots: default slot accepting ordinary HTML or custom elements.

## Contract summary

- Attributes: `title`, `content`, `description`, `tone`, `icon`
- Properties: `title`, `content`, `description`, `tone`, `icon`
- Events: none
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
