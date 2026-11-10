import { renderToolCall } from "/dist/slexkit.js";

const tool = document.getElementById("tool");
const result = document.getElementById("result");
let activeHandle;

const calls = {
  "confirm-action": {
    id: "call_confirm_release",
    name: "confirm-action",
    arguments: {
      title: "Approve release smoke",
      description: "Require a short reason before returning a structured result.",
      requireReason: true,
      reasonLabel: "Release note",
      reasonPlaceholder: "Why is this safe to publish?",
      confirmLabel: "Approve",
    },
  },
  "choose-options": {
    id: "call_choose_channels",
    name: "choose-options",
    arguments: {
      title: "Select channels",
      description: "Choose one or more channels for a controlled beta.",
      minSelected: 1,
      maxSelected: 2,
      options: [
        { id: "docs", label: "Docs site", selected: true },
        { id: "npm", label: "npm beta tag" },
        { id: "stable", label: "public stable", disabled: true },
      ],
      submitLabel: "Use channels",
    },
  },
  "fill-form": {
    id: "call_fill_form",
    name: "fill-form",
    arguments: {
      title: "Create integration task",
      description: "Collect typed values before submitting to the host.",
      submitLabel: "Create task",
      fields: [
        { name: "title", label: "Title", required: true, placeholder: "Write docs smoke" },
        { name: "estimate", label: "Estimate", type: "number", value: 2 },
        {
          name: "risk",
          label: "Risk",
          type: "select",
          value: "low",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
          ],
        },
        { name: "approved", label: "Approved", type: "switch", value: false },
      ],
    },
  },
};

function showResult(value) {
  result.textContent = JSON.stringify(value, null, 2);
}

function render(name) {
  activeHandle?.dispose();
  tool.textContent = "";
  result.textContent = "Waiting for user action...";
  activeHandle = renderToolCall(calls[name], tool);
  activeHandle.promise.then(showResult);
}

document.querySelectorAll("[data-tool]").forEach((button) => {
  button.addEventListener("click", () => render(button.dataset.tool));
});

render("confirm-action");
