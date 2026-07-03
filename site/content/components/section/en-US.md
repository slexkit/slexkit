---
title: "Section"
category: Layout
status: ready
order: 60
summary: "Page section with title, subtitle, optional action, and content area."
---
# Section

Page-level block container with title, subtitle, optional action link, and content area.

<!-- slex:spec-example:start component="section" id="basic" sourceHash="094666a8" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_section_typical",
  "layout": {
    "section:overview": {
      "eyebrow": "Dashboard",
      "title": "Runtime overview",
      "icon": "chart-bar",
      "subtitle": "This section groups the most important state.",
      "stat:latency": {
        "label": "Latency",
        "value": "42",
        "unit": "ms"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for dashboard blocks, settings groups, and categorized content areas.
- Not suitable for purely visual cards (use `card`) or untitled containers (use `column`).
- Related components: `card` is a lighter grouping container, while `section` provides a more complete heading structure.
- The heading area and content area are distinct; nest any layout component inside the content area.

### Eyebrow / subtitle variants

```slex
{
  namespace: "doc_section_eyebrow_diff",
  layout: {
    "column:demo": {
      "section:with-eyebrow": {
        eyebrow: "Overview",
        title: "With eyebrow",
        "text:body": {
          text: "Eyebrow appears above the title."
        }
      },
      "section:with-subtitle": {
        title: "With subtitle",
        subtitle: "Additional context below the title.",
        "text:body": {
          text: "Subtitle provides extra context."
        }
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="section" sourceHash="03916011" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `title` | string | No | Yes |  | Section title. |
| `icon` | string | No | No |  | Icon name shown before the title. |
| `eyebrow` | string | No | Yes |  | Small label above the title. |
| `subtitle` | string | No | Yes |  | Subtitle text below the title. |
| `actionLabel` | string | No | Yes |  | Optional action link label. |
| `actionHref` | string | No | No |  | Optional action link target. |
| child components | object | No | No |  | Nested component fields are rendered as child content in field order. |
<!-- slex:spec-api:end -->
