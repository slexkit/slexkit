import { childContent, component, example, semanticTones } from "../spec-helpers";

export const cardSpec = component({
    type: "card",
    category: "Layout",
    title: "Card",
    summary: "Bordered grouping container.",
    description: "Use card to group related content on a bounded surface.",
    props: {
      title: { type: "string", dynamic: true, description: "Card title." },
      icon: { type: "string", description: "Icon name shown before the title." },
      tone: { type: "string", values: semanticTones, description: "Optional semantic tone for the card surface." },
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
