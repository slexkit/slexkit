import { childContent, component, example } from "../spec-helpers";

export const columnSpec = component({
    type: "column",
    category: "Layout",
    title: "Column",
    summary: "Vertical layout container.",
    description: "Use column to stack child components vertically in field order.",
    props: {},
    children: childContent,
    examples: [example("column", {
        "namespace": "doc_column_typical",
        "layout": {
          "column:form": {
            "input:name": {
              "placeholder": "Name"
            },
            "input:email": {
              "placeholder": "Email"
            },
            "button:save": {
              "label": "Save"
            }
          }
        }
      })],
  });
