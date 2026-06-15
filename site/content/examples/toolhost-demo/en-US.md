---
title: "ToolHost Dialog Demo"
category: "Config Wizard"
status: published
order: 13
summary: "Demonstrates SlexKit's ToolHost capability — embedding interactive forms in an AI conversation flow, collecting user input and returning structured ToolResult."
tags: toolhost, dialog, demo, live
components: section, card, input, select, submit, callout, code-block, grid, column
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

## ToolHost Dialog Demo

When an AI needs to collect user information during a conversation, it calls **ToolHost** to pop up an interactive form card. The user fills it out and submits, and the form data is returned to the AI as a structured `ToolResult` for continued processing.

Below is a complete conversation demo — simulating a user requesting project creation, the AI calling the `fill-form` template to collect project info, and returning ToolResult after submission.

**Flow:** User request → AI determines tool call needed → ToolHost pops up form → User fills and submits → Returns ToolResult → AI continues responding

Here's how the AI side calls ToolHost:

```js
import { renderToolCall } from "slexkit/toolhost";

const { promise } = renderToolCall({
  name: "fill-form",
  arguments: {
    title: "Create New Project",
    description: "Please fill in the project details.",
    submitLabel: "Submit",
    ignoreLabel: "Cancel",
    fields: [
      { name: "name", label: "Project Name", type: "text", required: true },
      { name: "type", label: "Project Type", type: "select", options: [
        { label: "Web App", value: "web" },
        { label: "API Service", value: "api" },
        { label: "CLI Tool", value: "cli" },
      ]},
      { name: "priority", label: "Priority", type: "select", options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ]},
    ],
  },
}, container);

// After user submits, promise resolves to ToolResult
const result = await promise;
// → { toolName: "fill-form", status: "submitted", value: { name, type, priority } }
```
