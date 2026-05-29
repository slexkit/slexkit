import { component, example, noChildren } from "../spec-helpers";

export const switchSpec = component({
    type: "switch",
    category: "Input",
    title: "Switch",
    summary: "Boolean switch input.",
    description: "Use switch for an on/off setting.",
    props: {
      enabled: { type: "boolean", default: false, dynamic: true, description: "Enabled state." },
      label: { type: "string", dynamic: true, description: "Switch label." },
      icon: { type: "string", description: "Icon name shown before the visible label." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable the switch." },
      haptic: { type: "boolean", default: true, description: "Enable vibration feedback on supported devices." },
      haptics: { type: "boolean", default: true, description: "Alias for haptic." },
      onchange: { type: "write-expression", description: "Write expression invoked when enabled state changes." },
    },
    children: noChildren,
    examples: [example("switch", {
        "namespace": "doc_switch_typical",
        "layout": {
          "switch:feature": {
            "enabled": true,
            "label": "Enable sync",
            "icon": "arrows-clockwise"
          }
        }
      })],
  });
