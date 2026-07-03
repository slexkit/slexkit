---
title: "Icon"
category: Component
status: ready
order: 10
summary: "Shared icon field capability used by all icon-supporting components."
---
# Icon

Icon is not a standalone layout component — it is a component field capability. Components that support the `icon` field resolve icon names through the global icon manager and place the resulting SVG in their own visual position.

<!-- slex:spec-example:start component="icon" id="basic" sourceHash="5fce5080" -->
```slex
{
  "slex": "0.1",
  "namespace": "spec_button_basic",
  "layout": {
    "button:demo": {
      "label": "Settings",
      "icon": "gear-six",
      "iconOnly": true,
      "variant": "ghost"
    }
  }
}
```
<!-- slex:spec-example:end -->

## Supported components

| Component | Field | Description |
| --- | --- | --- |
| accordion | `items[].icon` | Icon before each accordion item trigger label. |
| badge | `icon` | Icon before the badge text. |
| button | `icon`, `iconOnly` | Icon before the button label; `iconOnly: true` shows only the icon while still requiring `label`. |
| callout | `icon` | Icon before the callout title. |
| card | `icon` | Icon before the card title. |
| checkbox | `icon` | Icon before the visible checkbox label. |
| code-block | `icon` | Icon before the code block title. |
| collapsible | `icon` | Icon before the collapsible trigger text. |
| divider | `icon` | Icon before the divider label text. |
| link | `icon` | Icon before the link text. |
| progress | `icon` | Icon before the progress label. |
| radio-group | `icon`, `options[].icon` | Icon before the group label and each option label. |
| section | `icon` | Icon before the section title. |
| select | `icon`, `options[].icon` | `icon` decorates the top label; `options[].icon` decorates menu options and the selected value. |
| slider | `icon` | Icon before the slider label. |
| stat | `icon` | Icon before the metric label. |
| switch | `icon` | Icon before the visible switch label. |
| table | `columns[].icon` | Icon before each table column header label. |
| tabs | `tabs[].icon`, `tabs[].iconOnly` | Icon in each tab trigger; selected tab may request an active variant. |
| toast | `icon` | Replaces the default left semantic marker with an icon while retaining tone color. |

`playground` internally reuses button for its toolbar actions, so it benefits from the same icon manager, but it does not expose a public `icon` field. `select`'s dropdown arrow is a fixed control indicator; `select.icon` only decorates the top label, not the dropdown arrow.

## Name resolution

Unprefixed icon names default to Iconify's `ph` collection (Phosphor icons).

```slex
{
  namespace: "doc_icon_names",
  layout: {
    "row:icons": {
      "button:chart": {
        label: "Chart",
        icon: "ChartBar"
      },
      "button:copy": {
        label: "Copy",
        icon: "lucide:copy",
        variant: "secondary"
      },
      "button:settings": {
        label: "Settings",
        icon: "gear-six",
        iconOnly: true,
        variant: "ghost"
      }
    }
  }
}
```

Common syntax:

| Syntax | Resolves to |
| ----------------- | ---------------------------------------- |
| `ChartBar` | `ph:chart-bar` |
| `chart-bar` | `ph:chart-bar` |
| `ph:chart-bar` | Phosphor / Iconify `ph` collection |
| `lucide:copy` | Iconify `lucide` collection |
| `brand:logo-mark` | Custom icon registered by the host via `registerIcon` |

## Tabs with icons

```slex
{
  namespace: "doc_icon_tabs",
  layout: {
    "tabs:main": {
      value: "overview",
      tabs: [
        {
          value: "overview",
          label: "Overview",
          icon: "ChartBar"
        },
        {
          value: "activity",
          label: "Activity",
          icon: "pulse"
        },
        {
          value: "settings",
          label: "Settings",
          icon: "Gear",
          iconOnly: true
        }
      ]
    }
  }
}
```

## Label and title icons

```slex
{
  namespace: "doc_icon_labels",
  layout: {
    "column:demo": {
      "callout:notice": {
        title: "Notice",
        icon: "info",
        text: "Title-bearing components can use the same icon field."
      },
      "accordion:faq": {
        value: "install",
        items: [
          {
            value: "install",
            label: "Install",
            icon: "download-simple",
            content: "Prepare dependencies."
          },
          {
            value: "review",
            label: "Review",
            icon: "check-circle",
            content: "Verify the result."
          }
        ]
      },
      "select:env": {
        label: "Environment",
        icon: "server",
        value: "prod",
        options: [
          { label: "Development", value: "dev", icon: "code" },
          { label: "Production", value: "prod", icon: "rocket-launch" }
        ]
      },
      "radio-group:mode": {
        label: "Mode",
        icon: "sliders-horizontal",
        value: "auto",
        options: [
          { label: "Auto", value: "auto", icon: "sparkle" },
          { label: "Manual", value: "manual", icon: "wrench" }
        ]
      }
    }
  }
}
```

## Custom icons

Hosts can register their own SVG icons before mounting content. Once registered, all components that support the `icon` field can use them by name.

```js
import { registerIcon, registerIcons } from "slexkit";

registerIcon(
  "brand:logo-mark",
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 15 15H1L8 1Z"/></svg>',
  { aliases: ["logo-mark"] },
);

registerIcons({
  "status:healthy":
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/></svg>',
});
```

## Usage rules

- `iconOnly` is supported on `button` and `tabs` only; titles, labels, and column headers never hide text.
- `iconOnly` must be paired with `label`, `title`, or `aria-label` — assistive technology needs a readable name.
- Without a prefix, prefer Phosphor semantic names; use an explicit prefix such as `lucide:copy` for cross-icon-set usage.
- The runtime does not accept arbitrary URLs as icon sources. Remote icons are fetched via the Iconify API and the returned SVG passes through basic filtering.
- Bundled icons display synchronously on first paint; unbundled icons load asynchronously. When the network is unavailable, components retain their text content.

## API Reference {#api}

<!-- slex:spec-api:start component="icon" sourceHash="cf2e09a0" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `icon` | string | No | No |  | Icon name resolved through the global icon manager. |
| `iconOnly` | boolean | No | No |  | Render only the icon while retaining an accessible label where supported. |
| `items[].icon` | string | No | No |  | Accordion item trigger icon. |
| `options[].icon` | string | No | No |  | Select or radio option icon. |
| `columns[].icon` | string | No | No |  | Table column header icon. |
| `tabs[].icon` | string | No | No |  | Tab trigger icon. |
| `tabs[].iconOnly` | boolean | No | No |  | Tab trigger icon-only mode. |
<!-- slex:spec-api:end -->
