---
title: "Toast"
category: Feedback
status: ready
order: 20
summary: "Transient notification with semantic type."
---

# Toast

Shows transient feedback with title, description, tone, icon, duration, and dismiss behavior; closing emits `close`.

## HTML example

```slex
<slex-toast></slex-toast>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | `""` | Toast heading. |
| `description` | string | `""` | Toast body text. |
| `tone` | string | `info` | Semantic tone; error and destructive normalize to danger. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `duration` | string / number | `0` | Auto-dismiss delay in milliseconds; zero or invalid values keep it visible. |
| `dismissable` | boolean | `true` | Shows the close control. The public spelling is dismissable. |

Events: `close`. Use native event listeners; read interactive values from component properties.

## Contract summary

- Attributes: `title`, `description`, `tone`, `icon`, `duration`, `dismissable`
- Properties: `title`, `description`, `tone`, `icon`, `duration`, `dismissable`
- Events: `close`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
