import { component, example, noChildren } from "../spec-helpers";

export const inputSpec = component({
    type: "input",
    category: "Input",
    title: "Input",
    summary: "Text or engineering-value input.",
    description: "Use input for editable text and engineering numeric values.",
    props: {
      value: { type: "string", dynamic: true, description: "Current input value." },
      label: { type: "string", dynamic: true, description: "Input label." },
      unit: { type: "string", dynamic: true, description: "Trailing unit text." },
      description: { type: "string", dynamic: true, description: "Assistive description below the input." },
      help: { type: "string", dynamic: true, description: "Alias for description." },
      hint: { type: "string", dynamic: true, description: "Alias for description." },
      error: { type: "string", dynamic: true, description: "Error text shown below the input and linked with aria-describedby." },
      errorMessage: { type: "string", dynamic: true, description: "Alias for error." },
      invalid: { type: "boolean", default: false, dynamic: true, description: "Mark the input as invalid with aria-invalid and error styling." },
      placeholder: { type: "string", description: "Placeholder text for empty values." },
      type: { type: "string", default: "text", description: "Input value kind; use engineering for parsed engineering values." },
      disabled: { type: "boolean", default: false, dynamic: true, description: "Disable editing." },
      readonly: { type: "boolean", default: false, dynamic: true, description: "Make the input read-only." },
      readOnly: { type: "boolean", default: false, dynamic: true, description: "Alias for readonly." },
      required: { type: "boolean", default: false, dynamic: true, description: "Mark the input as required." },
      id: { type: "string", description: "Native input id; defaults to a stable id derived from the component name." },
      name: { type: "string", description: "Native input name attribute." },
      min: { type: "string | number", dynamic: true, description: "Minimum value used by numeric input controls." },
      max: { type: "string | number", dynamic: true, description: "Maximum value used by numeric input controls." },
      step: { type: "string | number", dynamic: true, description: "Step size used by numeric input controls." },
      controls: { type: "boolean", default: true, dynamic: true, description: "Show decrement and increment buttons for numeric inputs." },
      onchange: { type: "write-expression", description: "Write expression invoked when the value changes." },
    },
    children: noChildren,
    examples: [example("input", {
        "namespace": "doc_input_typical",
        "layout": {
          "input:name": {
            "label": "Project",
            "value": "SlexKit",
            "placeholder": "Enter name",
            "description": "Visible labels keep form fields scannable."
          }
        }
      })],
  });
