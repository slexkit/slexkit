import { component, example, noChildren } from "../spec-helpers";

export const checkboxSpec = component({
    type: "checkbox",
    category: "Input",
    title: "Checkbox",
    summary: "Boolean checkbox input.",
    description: "Use checkbox for binary choices that can be toggled independently.",
    props: {
      checked: { type: "boolean", default: false, dynamic: true, description: "Checked state." },
      label: { type: "string", dynamic: true, description: "Checkbox label." },
      icon: { type: "string", description: "Icon name shown before the visible label." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable the checkbox." },
      haptic: { type: "boolean", default: true, description: "Enable vibration feedback on supported devices." },
      haptics: { type: "boolean", default: true, description: "Alias for haptic." },
      onchange: { type: "write-expression", description: "Write expression invoked when checked state changes." },
    },
    children: noChildren,
    examples: [example("checkbox", {
        "namespace": "doc_checkbox_typical",
        "layout": {
          "checkbox:agree": {
            "checked": true,
            "label": "I agree",
            "icon": "handshake"
          }
        }
      })],
  });
