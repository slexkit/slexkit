import { childContent, component, example } from "../spec-helpers";

export const stepSpec = component({
  type: "step",
  category: "Tooling",
  title: "ToolHost Step",
  summary: "ToolHost-only step page for multi-part human input.",
  description: "Use step inside ToolHost templates as the current page in a multi-step function call. It is not a public display component.",
  props: {
    title: { type: "string", description: "Step title." },
    description: { type: "string", description: "Short helper text for the step." },
    index: { type: "string | number", description: "Visible step number." },
    total: { type: "string | number", description: "Total step count shown with index." },
    progress: { type: "string", description: "Explicit progress label, such as 1/2." },
    state: { type: "string", description: "Optional visual state such as current or completed." },
  },
  children: childContent,
  examples: [example("step", {
    namespace: "doc_step_toolhost",
    layout: {
      "step:strategy": {
        title: "Release strategy",
        index: 1,
        "radio-group:choice": {
          options: [
            { label: "Canary", value: "canary" },
            { label: "Full", value: "full" },
          ],
        },
      },
    },
  })],
});
