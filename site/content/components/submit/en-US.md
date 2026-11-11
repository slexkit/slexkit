---
title: "Submit"
category: Tooling
status: ready
order: 20
summary: "ToolHost-only submit action that returns current selection or form values to the host."
---

# Submit

Exposes explicit `submit` and `ignore` actions for ToolHost-style workflows; it is not a native form submit replacement.

## HTML example

```slex
<slex-submit submit-label="Submit" ignore-label="Ignore"></slex-submit>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `submitLabel` / `submit-label` | string | `"Submit"` | Primary submit button label. |
| `ignoreLabel` / `ignore-label` | string | `"Ignore"` | Secondary ignore button label. |
| `disabled` | boolean | `false` | Disables only the submit button; Ignore remains available. |

Events: `submit`, `ignore`. Use native event listeners; read interactive values from component properties.

## Contract summary

- Attributes: `submit-label`, `ignore-label`, `disabled`
- Properties: `submitLabel`, `ignoreLabel`, `disabled`
- Events: `submit`, `ignore`
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
