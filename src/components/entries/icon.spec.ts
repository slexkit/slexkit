import { component, example, noChildren } from "../spec-helpers";

export const iconSpec = component({
    type: "icon",
    category: "Component",
    title: "Icon",
    summary: "Shared icon field capability.",
    description: "Icon is a shared field capability, not an independent icon component type.",
    props: {
      icon: { type: "string", description: "Icon name resolved through the global icon manager." },
      iconOnly: { type: "boolean", description: "Render only the icon while retaining an accessible label where supported." },
      "items[].icon": { type: "string", description: "Accordion item trigger icon." },
      "options[].icon": { type: "string", description: "Select or radio option icon." },
      "columns[].icon": { type: "string", description: "Table column header icon." },
      "tabs[].icon": { type: "string", description: "Tab trigger icon." },
      "tabs[].iconOnly": { type: "boolean", description: "Tab trigger icon-only mode." },
    },
    children: noChildren,
    examples: [example("button", { label: "Settings", icon: "gear-six", iconOnly: true, variant: "ghost" }, "Icon field usage")],
  });
