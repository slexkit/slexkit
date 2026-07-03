---
title: "Table"
category: Data
status: ready
order: 10
summary: "Structured table with columns and rows."
---
# Table

Structured row-column data display with column headers and data rows.

<!-- slex:spec-example:start component="table" id="basic" sourceHash="8491bf94" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_table_typical",
  "layout": {
    "table:routes": {
      "columns": [
        {
          "key": "name",
          "label": "Name",
          "icon": "text-t"
        },
        {
          "key": "status",
          "label": "Status",
          "icon": "check-circle"
        }
      ],
      "rows": [
        {
          "name": "Parse",
          "status": "ready"
        },
        {
          "name": "Publish",
          "status": "pending"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for data lists, configuration tables, and structured information display.
- Not suitable for card-style layouts (use `grid`).
- Related components: `grid` for equal-width card layouts.
- Column `key` values correspond to field names in each row.

## API Reference {#api}

<!-- slex:spec-api:start component="table" sourceHash="9a408c2a" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `columns` | array | No | No |  | Column definitions with key, label, and optional icon. |
| `columns[].icon` | string | No | No |  | Icon name shown before a column label. |
| `rows` | array | No | No |  | Row data objects keyed by column key. |
| `items` | array | No | No |  | Alias for rows. |
<!-- slex:spec-api:end -->
