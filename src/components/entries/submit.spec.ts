import { component, example, noChildren } from "../spec-helpers";

export const submitSpec = component({
    type: "submit",
    category: "Action",
    title: "Submit",
    summary: "ToolHost submit and ignore controls.",
    description: "Use submit inside tool templates to return selected state fields to the host.",
    props: {
      submitLabel: { type: "string", default: "Submit", description: "Submit button text." },
      ignoreLabel: { type: "string", default: "Ignore", description: "Ignore button text." },
      returnKeys: { type: "string[]", description: "State field paths returned to ToolHost." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable submit action." },
    },
    children: noChildren,
    examples: [example("submit", {
        "namespace": "doc_submit_typical",
        "layout": {
          "column:tool": {
            "input:title": {
              "value": "Release note",
              "placeholder": "Title"
            },
            "submit:done": {
              "submitLabel": "Submit",
              "ignoreLabel": "Ignore",
              "returnKeys": [
                "title"
              ]
            }
          }
        }
      })],
  });
