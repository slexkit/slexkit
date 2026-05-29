import { component, example, noChildren, semanticTones } from "../spec-helpers";

export const statSpec = component({
    type: "stat",
    category: "Display",
    title: "Stat",
    summary: "Metric display.",
    description: "Use stat to present a labeled metric value with optional unit and semantic tone.",
    props: {
      label: { type: "string", dynamic: true, description: "Metric label." },
      icon: { type: "string", description: "Icon name shown before the label." },
      value: { type: "string | number", dynamic: true, description: "Metric value." },
      unit: { type: "string", dynamic: true, description: "Unit shown after the value." },
      tone: { type: "string", values: semanticTones, description: "Optional semantic tone." },
      animateInitial: { type: "boolean", default: false, description: "Animate the initial rendered value." },
    },
    children: noChildren,
    examples: [example("stat", {
        "namespace": "doc_stat_typical",
        "layout": {
          "grid:stats": {
            "columns": 2,
            "stat:requests": {
              "label": "Requests",
              "icon": "activity",
              "value": "1.2k",
              "unit": "/min"
            },
            "stat:success": {
              "label": "Success",
              "icon": "check-circle",
              "value": "98.4",
              "unit": "%",
              "tone": "success"
            }
          }
        }
      })],
  });
