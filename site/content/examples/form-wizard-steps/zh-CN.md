---
title: "ToolHost 表单提问"
category: "配置向导"
status: published
order: 12
summary: "ToolHost 在对话中渲染表单卡片，收集项目信息并提交结构化结果。"
tags: toolhost, form, ai, conversation
components: section, card, input, select, submit, callout, code-block, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# ToolHost 表单提问

当对话需要补齐项目信息、服务配置或工单字段时，ToolHost 可以渲染表单卡片。用户提交后，结果以结构化数据返回。

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
      eyebrow: "ToolHost · 表单提问",
      title: "收集项目信息",
      subtitle: "表单提交后，ToolHost 返回结构化结果。",
      "callout:context": {
        tone: "info",
        text: "需要创建一个新项目，请填写以下信息。"
      },
      "grid:fields": {
        columns: 1, mdColumns: 2,
        "input:name": { label: "项目名称", "$value": "g.fields.name", placeholder: "my-project", onchange: "g.fields.name = String($event || '')" },
        "input:description": { label: "项目描述", "$value": "g.fields.description", placeholder: "简短描述项目用途", onchange: "g.fields.description = String($event || '')" },
        "select:type": {
          label: "项目类型",
          "$value": "g.fields.type",
          options: [
            { label: "Web 应用", value: "web" },
            { label: "API 服务", value: "api" },
            { label: "CLI 工具", value: "cli" }
          ],
          onchange: "g.fields.type = String($event)"
        },
        "select:priority": {
          label: "优先级",
          "$value": "g.fields.priority",
          options: [
            { label: "低", value: "low" },
            { label: "中", value: "medium" },
            { label: "高", value: "high" }
          ],
          onchange: "g.fields.priority = String($event)"
        }
      },
      "grid:actions": {
        columns: 2,
        "button:submit": { label: "提交", onclick: "g.submit()" },
        "button:skip": { label: "跳过" }
      },
      "callout:result": {
        "$tone": "g.submitted ? 'success' : 'info'",
        "$text": "g.submitted ? '已提交：' + g.formData.name + '（' + g.formData.type + '）' : '等待用户填写...'"
      },
      "code-block:toolresult": {
        title: "返回给宿主的 ToolResult",
        language: "json",
        "$code": "g.submitted ? JSON.stringify({ toolCallId: 'call_abc123', toolName: 'create-project', status: 'submitted', value: g.formData }, null, 2) : '// 提交后显示 ToolResult'"
      }
    }
  }
}
```

---

