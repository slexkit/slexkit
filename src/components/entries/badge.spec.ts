import { component, example, noChildren, semanticTones } from "../spec-helpers";

export const badgeSpec = component({
    type: "badge",
    category: "Content",
    title: "Badge",
    summary: "Compact label for status or classification.",
    description: "Use badge to annotate nearby content with a short semantic label.",
    props: {
      label: { type: "string", dynamic: true, description: "Badge text." },
      text: { type: "string", dynamic: true, description: "Alias for label." },
      content: { type: "string", dynamic: true, description: "Alias for label." },
      icon: { type: "string", description: "Icon name shown before the badge label." },
      tone: { type: "string", values: semanticTones, default: "info", description: "Semantic tone applied to the badge." },
      variant: { type: "string", values: semanticTones, description: "Alias for tone." },
    },
    children: noChildren,
    examples: [example("badge", {
        "namespace": "doc_badge_typical",
        "layout": {
          "row:badges": {
            "badge:ready": {
              "label": "ready",
              "icon": "check-circle",
              "tone": "success"
            },
            "badge:pending": {
              "label": "pending",
              "tone": "warning"
            },
            "badge:info": {
              "label": "info",
              "tone": "info"
            }
          }
        }
      })],
  });
