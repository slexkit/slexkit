import { component, example, noChildren } from "../spec-helpers";

export const accordionSpec = component({
    type: "accordion",
    category: "Disclosure",
    title: "Accordion",
    summary: "Expandable grouped panels.",
    description: "Use accordion to reveal one or more sections from a compact list of panels.",
    props: {
      value: { type: "string | string[]", dynamic: true, description: "Current expanded item value; use an array when multiple is true." },
      multiple: { type: "boolean", default: false, description: "Allow multiple items to be expanded at the same time." },
      items: { type: "array", description: "Panel definitions with value, label, content, and optional icon." },
      "items[].icon": { type: "string", description: "Icon name shown before an item trigger label." },
      onchange: { type: "write-expression", description: "Write expression invoked when expanded items change." },
    },
    children: noChildren,
    examples: [example("accordion", {
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
      })],
  });
