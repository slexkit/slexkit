---
title: "Accordion"
category: Disclosure
status: ready
summary: "Multi-panel collapse for FAQs or grouped details."
---
# Accordion

Manages multiple collapsible panels, with one or more open at a time.

<!-- slex:spec-example:start component="accordion" id="basic" sourceHash="0a070e32" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_accordion_typical",
  "layout": {
    "accordion:faq": {
      "multiple": true,
      "value": [
        "install"
      ],
      "items": [
        {
          "value": "install",
          "label": "Install",
          "icon": "download-simple",
          "content": "Prepare dependencies."
        },
        {
          "value": "review",
          "label": "Review",
          "icon": "check-circle",
          "content": "Check the result."
        },
        {
          "value": "ship",
          "label": "Ship",
          "icon": "rocket-launch",
          "content": "Publish the change."
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for FAQs, grouped details, and collapsible setting lists.
- Not suitable for a single expandable area (use `collapsible`).
- Related components: `collapsible` for single expandable regions.
- Use `$value` and `onchange` for controlled expansion.

## API Reference {#api}

<!-- slex:spec-api:start component="accordion" sourceHash="e838d3e9" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `value` | string \| string[] | No | Yes |  | Current expanded item value; use an array when multiple is true. |
| `multiple` | boolean | No | No | `false` | Allow multiple items to be expanded at the same time. |
| `items` | array | No | No |  | Panel definitions with value, label, content, and optional icon. |
| `items[].icon` | string | No | No |  | Icon name shown before an item trigger label. |
| `onchange` | write-expression | No | No |  | Write expression invoked when expanded items change. |
<!-- slex:spec-api:end -->
