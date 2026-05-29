import { component, example, noChildren } from "../spec-helpers";

export const tabsSpec = component({
    type: "tabs",
    category: "Navigation",
    title: "Tabs",
    summary: "Tabbed view switcher.",
    description: "Use tabs to switch between named content panels.",
    props: {
      value: { type: "string", dynamic: true, description: "Current active tab value." },
      tabs: { type: "array", description: "Tab definitions with value, label, content, icon, and iconOnly." },
      "tabs[].icon": { type: "string", description: "Icon name shown before a tab trigger label." },
      "tabs[].iconOnly": { type: "boolean", description: "Show only the tab icon while retaining label as accessible text." },
      orientation: { type: "string", values: ["horizontal", "vertical"], default: "horizontal", description: "Tab list orientation." },
      onchange: { type: "write-expression", description: "Write expression invoked when the active tab changes." },
    },
    children: noChildren,
    examples: [example("tabs", {
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
      })],
  });
