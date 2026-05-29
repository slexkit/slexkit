import { component, example, noChildren } from "../spec-helpers";

export const tableSpec = component({
    type: "table",
    category: "Data",
    title: "Table",
    summary: "Simple data table.",
    description: "Use table to render rows of keyed data against a column definition.",
    props: {
      columns: { type: "array", description: "Column definitions with key, label, and optional icon." },
      "columns[].icon": { type: "string", description: "Icon name shown before a column label." },
      rows: { type: "array", description: "Row data objects keyed by column key." },
      items: { type: "array", description: "Alias for rows." },
    },
    children: noChildren,
    examples: [example("table", {
        "namespace": "doc_table_typical",
        "layout": {
          "table:routes": {
            "columns": [
              {
                "key": "name",
                "label": "Name",
                "icon": "text-t"
              },
              {
                "key": "status",
                "label": "Status",
                "icon": "check-circle"
              }
            ],
            "rows": [
              {
                "name": "Parse",
                "status": "ready"
              },
              {
                "name": "Publish",
                "status": "pending"
              }
            ]
          }
        }
      })],
  });
