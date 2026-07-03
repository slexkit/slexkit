import { component, example, noChildren } from "../spec-helpers";

export const radioGroupSpec = component({
    type: "radio-group",
    category: "Input",
    title: "Radio Group",
    summary: "Single-choice option group.",
    description: "Use radio-group for one-of-many choices.",
    props: {
      value: { type: "string", dynamic: true, description: "Current selected value." },
      label: { type: "string", dynamic: true, description: "Group label." },
      icon: { type: "string", description: "Icon name shown before the group label." },
      options: { type: "array", description: "Options with label, value, and optional icon." },
      "options[].icon": { type: "string", description: "Icon name shown before a single option label." },
      "options[].description": { type: "string", description: "Secondary text shown below the option label." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable every radio option in the group." },
      orientation: { type: "string", values: ["vertical", "horizontal"], default: "vertical", description: "Radio option layout direction." },
      variant: { type: "string", values: ["list"], description: "Use list for full-row option surfaces in ToolHost decision cards." },
      haptic: { type: "boolean", default: true, description: "Enable vibration feedback on supported devices." },
      haptics: { type: "boolean", default: true, description: "Alias for haptic." },
      name: { type: "string", description: "Native radio group name shared by options." },
      onchange: { type: "write-expression", description: "Write expression invoked when selection changes." },
    },
    children: noChildren,
    examples: [example("radio-group", {
        "namespace": "doc_radio_group_typical",
        "layout": {
          "radio-group:mode": {
            "label": "Mode",
            "icon": "sliders-horizontal",
            "value": "auto",
            "options": [
              {
                "label": "Auto",
                "value": "auto",
                "icon": "sparkle"
              },
              {
                "label": "Manual",
                "value": "manual",
                "icon": "wrench"
              }
            ]
          }
        }
      })],
  });
