import { childContent, component, example } from "../spec-helpers";

export const calloutSpec = component({
    type: "callout",
    category: "Content",
    title: "Callout",
    summary: "Highlighted contextual message.",
    description: "Use callout for notes, warnings, and other contextual blocks.",
    props: {
      title: { type: "string", dynamic: true, description: "Callout title." },
      heading: { type: "string", dynamic: true, description: "Alias for title." },
      label: { type: "string", dynamic: true, description: "Alias for title." },
      icon: { type: "string", description: "Icon name shown before the title." },
      text: { type: "string", dynamic: true, description: "Callout body text." },
      message: { type: "string", dynamic: true, description: "Alias for text." },
      content: { type: "string", dynamic: true, description: "Alias for text." },
      tone: { type: "string", values: ["info", "success", "warning", "danger"], default: "info", description: "Semantic tone for the callout." },
    },
    children: childContent,
    examples: [example("callout", {
        "namespace": "doc_callout_typical",
        "layout": {
          "callout:notice": {
            "tone": "info",
            "title": "Notice",
            "icon": "info",
            "text": "Use callout for information that should stand out."
          }
        }
      })],
  });
