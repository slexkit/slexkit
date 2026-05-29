---
title: "Tabs"
category: Navigation
status: ready
summary: "Tabbed view switcher."
---
# Tabs

Switch between named content panels.

<!-- slex:spec-example:start component="tabs" id="basic" sourceHash="df3a28e8" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_tabs_typical",
  "layout": {
    "tabs:main": {
      "value": "overview",
      "tabs": [
        {
          "value": "overview",
          "label": "Overview"
        },
        {
          "value": "settings",
          "label": "Settings"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for settings panel sections, content category switching, and configuration groups.
- Not suitable for multi-page wizards — use explicit page state and navigation.
- Related components: `button` for submit actions, `link` for cross-page navigation.
- Use `$value` and `onchange` for controlled switching.

### Orientation variants

```slex
{
  namespace: "doc_tabs_orientation_diff",
  layout: {
    "row:orientations": {
      "column:h": {
        "text:horiz": {
          text: "horizontal (default)"
        },
        "tabs:horizontal": {
          value: "a",
          orientation: "horizontal",
          tabs: [
            {
              value: "a",
              label: "Tab A"
            },
            {
              value: "b",
              label: "Tab B"
            }
          ]
        }
      },
      "column:v": {
        "text:vert": {
          text: "vertical"
        },
        "tabs:vertical": {
          value: "a",
          orientation: "vertical",
          tabs: [
            {
              value: "a",
              label: "Tab A"
            },
            {
              value: "b",
              label: "Tab B"
            }
          ]
        }
      }
    }
  }
}
```

## API Reference {#api}

<!-- slex:spec-api:start component="tabs" sourceHash="a8288681" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `value` | string | No | Yes |  | Current active tab value. |
| `tabs` | array | No | No |  | Tab definitions with value, label, content, icon, and iconOnly. |
| `tabs[].icon` | string | No | No |  | Icon name shown before a tab trigger label. |
| `tabs[].iconOnly` | boolean | No | No |  | Show only the tab icon while retaining label as accessible text. |
| `orientation` | string: horizontal, vertical | No | No | `"horizontal"` | Tab list orientation. |
| `onchange` | write-expression | No | No |  | Write expression invoked when the active tab changes. |
<!-- slex:spec-api:end -->
