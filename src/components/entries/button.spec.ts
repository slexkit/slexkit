import { component, example, noChildren } from "../spec-helpers";

export const buttonSpec = component({
    type: "button",
    category: "Action",
    title: "Button",
    summary: "Action trigger.",
    description: "Use button for explicit actions in interactive SlexKit layouts.",
    props: {
      label: { type: "string", dynamic: true, description: "Visible button text and accessible name." },
      icon: { type: "string", description: "Icon name shown before the label." },
      iconOnly: { type: "boolean", default: false, description: "Show only the icon while retaining label as the accessible name." },
      variant: { type: "string", values: ["primary", "secondary", "danger", "ghost"], default: "primary", description: "Semantic action variant." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable the action." },
      href: { type: "string", dynamic: true, description: "Render the button surface as a link to this URL." },
      target: { type: "string", description: "Link target used when href is present." },
      title: { type: "string", dynamic: true, description: "Tooltip and accessible-label fallback." },
      selected: { type: "boolean", dynamic: true, description: "Render the icon in its selected visual state." },
      active: { type: "boolean", dynamic: true, description: "Render the icon in its active visual state." },
      pressed: { type: "boolean", dynamic: true, description: "Expose pressed state and render the selected icon style." },
      onclick: { type: "write-expression", description: "Write expression invoked when the button is clicked." },
    },
    children: noChildren,
    examples: [example("button", {
        "namespace": "doc_button_typical",
        "layout": {
          "row:actions": {
            "button:save": {
              "label": "Save",
              "icon": "floppy-disk",
              "variant": "primary"
            },
            "button:cancel": {
              "label": "Cancel",
              "variant": "secondary"
            },
            "button:delete": {
              "label": "Delete",
              "variant": "danger"
            }
          }
        }
      })],
  });
