---
title: "Link"
category: Content
status: ready
summary: "Navigation or lightweight jump action."
---
# Link

Text link navigation.

<!-- slex:spec-example:start component="link" id="basic" sourceHash="cf9f6896" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_link_typical",
  "layout": {
    "column:links": {
      "link:docs": {
        "href": "/components",
        "icon": "arrow-square-out",
        "text": "View components"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for page navigation, external links, and inline text links.
- Not suitable for primary action buttons (use `button`).
- Related components: `button` for explicit action triggers.
- Keep link text short.

## API Reference {#api}

<!-- slex:spec-api:start component="link" sourceHash="7404dc9d" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `href` | string | No | No |  | Target URL. |
| `text` | string | No | Yes |  | Visible link text. |
| `label` | string | No | Yes |  | Alias for text. |
| `content` | string | No | Yes |  | Alias for text. |
| `icon` | string | No | No |  | Icon name shown before link text. |
| `target` | string | No | No |  | Native link target attribute. |
| `variant` | string: default, muted | No | No | `"default"` | Link visual variant. |
<!-- slex:spec-api:end -->
