---
title: "Section"
category: Layout
status: ready
order: 60
summary: "Page section with title, subtitle, optional action, and content area."
---

# Section

Creates a titled content section with optional subtitle and icon; section body uses the default slot.

## HTML example

```slex
<slex-section title="Project" subtitle="Overview">
  <slex-text text="Everything is ready."></slex-text>
</slex-section>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | `""` | Section heading. |
| `subtitle` | string | `""` | Supporting text below the heading. |
| `icon` | string | `""` | Heading icon; it renders only when a header exists. |

Slots: default slot accepting ordinary HTML or custom elements.

## Contract summary

- Attributes: `title`, `subtitle`, `icon`
- Properties: `title`, `subtitle`, `icon`
- Events: none
- Slots: `default`

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
