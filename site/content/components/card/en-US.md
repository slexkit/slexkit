---
title: "Card"
category: Layout
status: ready
order: 50
summary: "Grouping container for related content."
---

# Card

Groups related content in a titled surface with optional icon, tone, and variant; child content uses the default slot.

## HTML example

```slex
<slex-card title="Metrics" icon="chart-bar">
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;">
    <slex-stat label="Requests" value="1.2k" unit="/min"></slex-stat>
    <slex-stat label="Latency" value="42" unit="ms"></slex-stat>
  </div>
</slex-card>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | `""` | Optional heading above the default-slot content. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `tone` | string | unset | Tone data value used by theme styles. |
| `variant` | string | unset | Presentation variant data value. |

Slots: default slot accepting ordinary HTML or custom elements.

## Contract summary

- Attributes: `title`, `icon`, `tone`, `variant`
- Properties: `title`, `icon`, `tone`, `variant`
- Events: none
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
