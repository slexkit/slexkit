import { component, example, noChildren } from "../spec-helpers";

export const dividerSpec = component({
    type: "divider",
    category: "Content",
    title: "Divider",
    summary: "Visual separator.",
    description: "Use divider to separate related regions, optionally with a label.",
    props: {
      label: { type: "string", dynamic: true, description: "Text shown in the divider." },
      icon: { type: "string", description: "Icon name shown before the label." },
    },
    children: noChildren,
    examples: [example("divider", {
        "namespace": "doc_divider_typical",
        "layout": {
          "column:content": {
            "text:top": {
              "text": "Above"
            },
            "divider:line": {
              "label": "Divider",
              "icon": "flag"
            },
            "text:bottom": {
              "text": "Below"
            }
          }
        }
      })],
  });
