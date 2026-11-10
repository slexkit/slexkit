---
title: "Table"
category: Data
status: ready
order: 10
summary: "Structured table with columns and rows."
---

# Table

Renders text-only tabular data from live `.columns` and `.rows`/`.items` arrays; these arrays are properties, not JSON attributes.

## HTML example

```slex
<slex-table id="items"></slex-table>
<script type="module">
  const table = slex.root.querySelector("#items"); table.columns = [{ key: "name", label: "Name" }]; table.rows = [{ name: "Ada" }];
</script>
```

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | array | `[]` | Property-only column keys or { key, label, icon } objects. |
| `rows` | array | `[]` | Property-only row data; takes precedence over items, including an empty array. |
| `items` | array | `[]` | Property-only fallback row data used when rows is unset. |

## Contract summary

- Attributes: none
- Properties: `columns`, `rows`, `items`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
