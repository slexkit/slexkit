import { childContent, component, example } from "../spec-helpers";

export const collapsibleSpec = component({
    type: "collapsible",
    category: "Disclosure",
    title: "Collapsible",
    summary: "Single expandable region.",
    description: "Use collapsible to show or hide one related content region.",
    props: {
      open: { type: "boolean", default: false, dynamic: true, description: "Expanded state." },
      trigger: { type: "string", dynamic: true, description: "Trigger button text." },
      icon: { type: "string", description: "Icon name shown before trigger text." },
      content: { type: "string", dynamic: true, description: "Static body content." },
      onchange: { type: "write-expression", description: "Write expression invoked when open state changes." },
    },
    children: childContent,
    examples: [example("collapsible", {
        "namespace": "doc_collapsible_typical",
        "layout": {
          "collapsible:more": {
            "open": true,
            "trigger": "Details",
            "icon": "caret-circle-down",
            "content": "This secondary content can be collapsed."
          }
        }
      })],
  });
