import { component, example, noChildren } from "../spec-helpers";

export const selectSpec = component({
    type: "select",
    category: "Input",
    title: "Select",
    summary: "Dropdown selection input.",
    description: "Use select for compact single-choice selection from an option list.",
    props: {
      label: { type: "string", dynamic: true, description: "Select label." },
      icon: { type: "string", description: "Icon name shown before the top label." },
      value: { type: "string", dynamic: true, description: "Current selected value." },
      options: { type: "array", description: "Options with label, value, and optional icon." },
      "options[].icon": { type: "string", description: "Icon name shown before an option label." },
      placeholder: { type: "string", description: "Placeholder shown when no value is selected." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable the select trigger and native select." },
      required: { type: "boolean", default: false, dynamic: true, description: "Require a non-placeholder value in the native select." },
      variant: { type: "string", values: ["default", "toolbar"], default: "default", description: "Select surface variant." },
      onchange: { type: "write-expression", description: "Write expression invoked when selection changes." },
    },
    children: noChildren,
    examples: [example("select", {
        "namespace": "doc_select_typical",
        "layout": {
          "select:env": {
            "label": "Environment",
            "icon": "server",
            "value": "prod",
            "options": [
              {
                "label": "Development",
                "value": "dev",
                "icon": "code"
              },
              {
                "label": "Production",
                "value": "prod",
                "icon": "rocket-launch"
              }
            ]
          }
        }
      })],
  });
