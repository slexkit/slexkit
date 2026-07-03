---
title: "ToolHost Form Question"
category: "Config Wizard"
status: published
order: 12
summary: "ToolHost renders a form card during a conversation, collects project fields, and submits structured results."
tags: toolhost, form, ai, conversation
components: section, card, input, select, submit, callout, code-block, grid, column
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# ToolHost Form Question

When a conversation needs project details, service configuration, or ticket fields, ToolHost can render a form card. After the user submits, the result returns as structured data.

```slex
{
  slex: "0.1",
  namespace: "example_form_wizard",
  g: {
    submitted: false,
    formData: null,
    fields: { name: "", description: "", type: "web", priority: "medium" },
    submit: function () {
      this.submitted = true;
      this.formData = { name: this.fields.name, description: this.fields.description, type: this.fields.type, priority: this.fields.priority, timestamp: new Date().toLocaleString() };
    }
  },
  layout: {
    "section:toolhost": {
      eyebrow: "ToolHost · Form Question",
      title: "Collect Project Information",
      subtitle: "After submission, ToolHost returns a structured result.",
      "callout:context": {
        tone: "info",
        text: "Create a new project by filling in the fields below."
      },
      "grid:fields": {
        columns: 1, mdColumns: 2,
        "input:name": { label: "Project name", "$value": "g.fields.name", placeholder: "my-project", onchange: "g.fields.name = String($event || '')" },
        "input:description": { label: "Description", "$value": "g.fields.description", placeholder: "Brief project description", onchange: "g.fields.description = String($event || '')" },
        "select:type": {
          label: "Project type",
          "$value": "g.fields.type",
          options: [
            { label: "Web App", value: "web" },
            { label: "API Service", value: "api" },
            { label: "CLI Tool", value: "cli" }
          ],
          onchange: "g.fields.type = String($event)"
        },
        "select:priority": {
          label: "Priority",
          "$value": "g.fields.priority",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" }
          ],
          onchange: "g.fields.priority = String($event)"
        }
      },
      "grid:actions": {
        columns: 2,
        "button:submit": { label: "Submit", onclick: "g.submit()" },
        "button:skip": { label: "Skip" }
      },
      "callout:result": {
        "$tone": "g.submitted ? 'success' : 'info'",
        "$text": "g.submitted ? 'Submitted: ' + g.formData.name + ' (' + g.formData.type + ')' : 'Waiting for user input...'"
      },
      "code-block:toolresult": {
        title: "ToolResult returned to host",
        language: "json",
        "$code": "g.submitted ? JSON.stringify({ toolCallId: 'call_abc123', toolName: 'create-project', status: 'submitted', value: g.formData }, null, 2) : '// ToolResult appears after submission'"
      }
    }
  }
}
```

---
