import { component, example, noChildren } from "../spec-helpers";

export const toastSpec = component({
    type: "toast",
    category: "Feedback",
    title: "Toast",
    summary: "Transient notification.",
    description: "Use toast to show an inline notification with semantic status.",
    props: {
      title: { type: "string", dynamic: true, description: "Toast title." },
      heading: { type: "string", dynamic: true, description: "Alias for title." },
      label: { type: "string", dynamic: true, description: "Alias for title." },
      icon: { type: "string", description: "Icon name shown at the left of the toast." },
      description: { type: "string", dynamic: true, description: "Toast body text." },
      text: { type: "string", dynamic: true, description: "Alias for description." },
      message: { type: "string", dynamic: true, description: "Alias for description." },
      content: { type: "string", dynamic: true, description: "Alias for description." },
      type: { type: "string", values: ["info", "success", "warning", "danger"], default: "info", description: "Semantic notification type." },
      tone: { type: "string", values: ["info", "success", "warning", "danger"], default: "info", description: "Alias for type." },
      duration: { type: "number", description: "Auto-hide delay in milliseconds." },
      dismissable: { type: "boolean", default: true, description: "Show a close button." },
      dismissible: { type: "boolean", default: true, description: "Alias for dismissable." },
      closeLabel: { type: "string", default: "Close notification", description: "Accessible close button label." },
      closeAriaLabel: { type: "string", description: "Alias for closeLabel." },
    },
    children: noChildren,
    examples: [example("toast", {
        "namespace": "doc_toast_typical",
        "layout": {
          "toast:saved": {
            "type": "success",
            "title": "Saved",
            "icon": "check-circle",
            "description": "Changes have been written."
          }
        }
      })],
  });
