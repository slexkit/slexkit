---
title: "Link"
category: Content
status: ready
order: 25
summary: "Navigation or lightweight jump action."
---

# Link

Renders a navigable link from `href`, text/label, target, icon, and variant; URL policy still applies inside isolated documents.

## HTML example

```slex
<slex-link></slex-link>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | string | `""` | Primary visible link text. |
| `label` | string | `""` | Alternate label field; the light-DOM-derived text takes precedence. Prefer text or element text. |
| `href` | string | `"#"` | Destination URL; executable URL schemes are replaced with #. |
| `target` | string | unset | Browsing-context target; _blank also adds noreferrer. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `variant` | string | unset | Variant data value used by theme styles. |

## Contract summary

- Attributes: `text`, `label`, `href`, `target`, `icon`, `variant`
- Properties: `text`, `label`, `href`, `target`, `icon`, `variant`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
