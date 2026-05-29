import { childContent, component, example } from "../spec-helpers";

export const rowSpec = component({
    type: "row",
    category: "Layout",
    title: "Row",
    summary: "Horizontal layout container.",
    description: "Use row to place child components horizontally in field order.",
    props: {
      justify: { type: "string", values: ["start", "center", "end", "space-between", "space-around"], default: "start", description: "Main-axis distribution." },
      align: { type: "string", values: ["start", "center", "end", "baseline", "stretch"], default: "center", description: "Cross-axis alignment." },
      gap: { type: "string", dynamic: true, description: "Spacing between children." },
    },
    children: childContent,
    examples: [example("row", {
        "namespace": "doc_row_typical",
        "layout": {
          "row:toolbar": {
            "justify": "space-between",
            "text:title": {
              "text": "Runtime status"
            },
            "button:refresh": {
              "label": "Refresh"
            }
          }
        }
      })],
  });
