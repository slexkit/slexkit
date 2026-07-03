import { childContent, component, example, semanticTones } from "../spec-helpers";

export const cardSpec = component({
    type: "card",
    category: "Layout",
    title: "Card",
    summary: "Grouping container for related content.",
    description: "Use card to group related content on a framed surface.",
    props: {
      title: { type: "string", dynamic: true, description: "Card title." },
      icon: { type: "string", description: "Icon name shown before the title." },
      tone: { type: "string", values: semanticTones, description: "Optional semantic tone for the card surface." },
      variant: { type: "string", values: ["tool"], description: "Use tool for ToolHost input cards with compact chrome." },
    },
    children: childContent,
    examples: [example("card", {
        "namespace": "doc_card_typical",
        "layout": {
          "card:metrics": {
            "title": "Metrics",
            "icon": "chart-bar",
            "grid:items": {
              "columns": 2,
              "stat:requests": {
                "label": "Requests",
                "value": "1.2k",
                "unit": "/min"
              },
              "stat:latency": {
                "label": "Latency",
                "value": "42",
                "unit": "ms"
              }
            }
          }
        }
      })],
  });
