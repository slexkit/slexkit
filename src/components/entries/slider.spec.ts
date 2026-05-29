import { component, example, noChildren } from "../spec-helpers";

export const sliderSpec = component({
    type: "slider",
    category: "Input",
    title: "Slider",
    summary: "Numeric range input.",
    description: "Use slider for bounded numeric adjustments such as volume, brightness, or thresholds.",
    props: {
      label: { type: "string", dynamic: true, description: "Slider label." },
      icon: { type: "string", description: "Icon name shown before the label." },
      value: { type: "number", default: 0, dynamic: true, description: "Current numeric value." },
      min: { type: "number", default: 0, dynamic: true, description: "Minimum value." },
      max: { type: "number", default: 100, dynamic: true, description: "Maximum value." },
      step: { type: "number", default: 1, dynamic: true, description: "Step interval." },
      unit: { type: "string", dynamic: true, description: "Unit shown after the value." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable the range input." },
      orientation: { type: "string", values: ["horizontal", "vertical"], default: "horizontal", description: "Slider orientation metadata used for styling." },
      haptic: { type: "boolean", default: true, description: "Enable vibration feedback on supported devices." },
      haptics: { type: "boolean", default: true, description: "Alias for haptic." },
      onchange: { type: "write-expression", description: "Write expression invoked when the value changes." },
    },
    children: noChildren,
    examples: [example("slider", {
        "namespace": "doc_slider_typical",
        "layout": {
          "slider:volume": {
            "label": "Volume",
            "icon": "speaker-high",
            "value": 42,
            "min": 0,
            "max": 100,
            "step": 1,
            "unit": "%"
          }
        }
      })],
  });
