import { component, example, noChildren } from "../spec-helpers";

export const textSpec = component({
    type: "text",
    category: "Display",
    title: "Text",
    summary: "Plain text display.",
    description: "Use text for short static or dynamic copy inside SlexKit layouts.",
    props: {
      text: { type: "string", dynamic: true, description: "Displayed text." },
      content: { type: "string", dynamic: true, description: "Alias for text." },
      label: { type: "string", dynamic: true, description: "Alias for text." },
      variant: { type: "string", values: ["default", "muted"], default: "default", description: "Text visual variant." },
      class: { type: "string", description: "Additional host-controlled CSS class." },
    },
    children: noChildren,
    examples: [example("text", {
        "namespace": "doc_text_typical",
        "layout": {
          "text:status": {
            "text": "System is healthy"
          }
        }
      })],
  });
