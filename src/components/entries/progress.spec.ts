import { component, example, noChildren } from "../spec-helpers";

export const progressSpec = component({
    type: "progress",
    category: "Feedback",
    title: "Progress",
    summary: "Progress bar.",
    description: "Use progress to show completion as a percentage.",
    props: {
      value: { type: "number", default: 0, dynamic: true, description: "Progress percentage from 0 to 100." },
      label: { type: "string", dynamic: true, description: "Progress label." },
      icon: { type: "string", description: "Icon name shown before the label." },
      indeterminate: { type: "boolean", default: false, dynamic: true, description: "Render an indeterminate progress state without aria-valuenow." },
    },
    children: noChildren,
    examples: [example("progress", {
        "namespace": "doc_progress_typical",
        "layout": {
          "progress:build": {
            "label": "Build progress",
            "icon": "gear-six",
            "value": 64
          }
        }
      })],
  });
