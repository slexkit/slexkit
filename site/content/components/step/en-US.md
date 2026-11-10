---
title: "ToolHost Step"
category: Tooling
status: ready
order: 21
summary: "ToolHost-only step page for collecting multiple human inputs inside one function call."
---

# ToolHost Step

Displays one workflow step with title, description, index/total, state, progress, and optional slotted details.

## HTML example

```slex
<slex-step></slex-step>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | `""` | Step heading. |
| `description` | string | `""` | Supporting text below the heading. |
| `index` | string / number | unset | Current step index; shown alone unless total is set. |
| `total` | string / number | unset | Total step count, rendered with index as index/total. |
| `state` | string | unset | State data value used by theme styles. |
| `progress` | string / number | `""` | Explicit progress label; takes precedence over index and total when non-empty. |

Slots: default slot accepting ordinary HTML or custom elements.

## Contract summary

- Attributes: `title`, `description`, `index`, `total`, `state`, `progress`
- Properties: `title`, `description`, `index`, `total`, `state`, `progress`
- Events: none
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
