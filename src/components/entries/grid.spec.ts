import { childContent, component, example } from "../spec-helpers";

export const gridSpec = component({
    type: "grid",
    category: "Layout",
    title: "Grid",
    summary: "Responsive grid container.",
    description: "Use grid to arrange child components in responsive columns.",
    props: {
      columns: { type: "number", default: 1, dynamic: true, description: "Base column count." },
      smColumns: { type: "number", dynamic: true, description: "Column count at the small breakpoint." },
      mdColumns: { type: "number", dynamic: true, description: "Column count at the medium breakpoint." },
      lgColumns: { type: "number", dynamic: true, description: "Column count at the large breakpoint." },
      xlColumns: { type: "number", dynamic: true, description: "Column count at the extra-large breakpoint." },
      gap: { type: "string", dynamic: true, description: "Spacing between grid items." },
    },
    children: childContent,
    examples: [example("grid", {
        "namespace": "doc_grid_typical",
        "layout": {
          "grid:stats": {
            "columns": 1,
            "mdColumns": 3,
            "stat:a": {
              "label": "Requests",
              "value": "1.2k"
            },
            "stat:b": {
              "label": "Success",
              "value": "98%"
            },
            "stat:c": {
              "label": "Errors",
              "value": "3"
            }
          }
        }
      })],
  });
