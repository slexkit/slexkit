import { component, example, noChildren } from "../spec-helpers";

export const linkSpec = component({
    type: "link",
    category: "Content",
    title: "Link",
    summary: "Inline navigation link.",
    description: "Use link to navigate to another page or resource.",
    props: {
      href: { type: "string", description: "Target URL." },
      text: { type: "string", dynamic: true, description: "Visible link text." },
      label: { type: "string", dynamic: true, description: "Alias for text." },
      content: { type: "string", dynamic: true, description: "Alias for text." },
      icon: { type: "string", description: "Icon name shown before link text." },
      target: { type: "string", description: "Native link target attribute." },
      variant: { type: "string", values: ["default", "muted"], default: "default", description: "Link visual variant." },
    },
    children: noChildren,
    examples: [example("link", {
        "namespace": "doc_link_typical",
        "layout": {
          "column:links": {
            "link:docs": {
              "href": "/components",
              "icon": "arrow-square-out",
              "text": "View components"
            }
          }
        }
      })],
  });
