import { childContent, component, example } from "../spec-helpers";

export const sectionSpec = component({
    type: "section",
    category: "Content",
    title: "Section",
    summary: "Page section with optional heading chrome.",
    description: "Use section to group page content with title, subtitle, and optional action link.",
    props: {
      title: { type: "string", dynamic: true, description: "Section title." },
      icon: { type: "string", description: "Icon name shown before the title." },
      eyebrow: { type: "string", dynamic: true, description: "Small label above the title." },
      subtitle: { type: "string", dynamic: true, description: "Subtitle text below the title." },
      actionLabel: { type: "string", dynamic: true, description: "Optional action link label." },
      actionHref: { type: "string", description: "Optional action link target." },
    },
    children: childContent,
    examples: [example("section", {
        "namespace": "doc_section_typical",
        "layout": {
          "section:overview": {
            "eyebrow": "Dashboard",
            "title": "Runtime overview",
            "icon": "chart-bar",
            "subtitle": "This section groups the most important state.",
            "stat:latency": {
              "label": "Latency",
              "value": "42",
              "unit": "ms"
            }
          }
        }
      })],
  });
