---
title: "ToolHost Form Question"
category: "Config Wizard"
status: published
order: 12
summary: "During an AI conversation, a form card pops up to collect user information — user fills and submits, then the result is displayed."
tags: toolhost, form, ai, conversation
components: section, card, input, select, submit, callout, code-block, grid, column
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# ToolHost Form Question

During an AI conversation, there are times when user information needs to be collected — creating a project, configuring a service, submitting a ticket. The AI pops up a form card, the user fills it out and submits, and the AI continues processing.

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
      title: "AI Needs to Collect Information",
      subtitle: "AI pops up a form, user fills it out and submits, AI continues processing.",
      "callout:context": {
        tone: "info",
        text: "AI: I need to create a new project for you. Please fill in the following information."
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
        title: "ToolResult returned to AI",
        language: "json",
        "$code": "g.submitted ? JSON.stringify({ toolCallId: 'call_abc123', toolName: 'create-project', status: 'submitted', value: g.formData }, null, 2) : '// ToolResult appears after submission'"
      }
    }
  }
}
```

---
