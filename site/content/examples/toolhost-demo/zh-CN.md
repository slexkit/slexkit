---
title: "ToolHost 对话演示"
category: "配置向导"
status: published
order: 13
summary: "用 SlexKit 组件模拟 AI 对话流：AI 提问 → ToolHost 弹出 → 用户提交 → 返回结果。"
tags: toolhost, dialog, demo, live
components: section, card, input, select, button, callout, code-block, grid, badge
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# ToolHost 对话演示

这是一个活的 SlexKit 组件，模拟 AI 对话流。点击按钮触发 ToolHost，填写表单后查看返回结果。

```slex
{
  slex: "0.1",
  namespace: "toolhost_demo",
  g: {
    stage: "idle",
    fields: { name: "", type: "web", priority: "medium" },
    result: null,
    startToolHost: function () {
      this.stage = "form";
    },
    submitForm: function () {
      this.result = {
        toolCallId: "call_" + Math.random().toString(36).slice(2, 8),
        toolName: "create-project",
        status: "submitted",
        value: {
          name: this.fields.name,
          type: this.fields.type,
          priority: this.fields.priority,
          timestamp: new Date().toISOString()
        }
      };
      this.stage = "result";
    },
    reset: function () {
      this.stage = "idle";
      this.fields = { name: "", type: "web", priority: "medium" };
      this.result = null;
    }
  },
  layout: {
    "section:demo": {
      eyebrow: "ToolHost · 对话演示",
      title: "AI 对话中的工具调用",
      subtitle: "点击按钮模拟 AI 发起工具调用，填写表单后查看返回结果。",

      "callout:ai-message": {
        tone: "info",
        text: "AI：我需要为你创建一个新项目，请告诉我项目的基本信息。"
      },

      "button:start": {
        label: "填写项目信息",
        onclick: "g.startToolHost()"
      },

      "card:form": {
        "$if": "g.stage === 'form'",
        title: "创建新项目",
        "grid:fields": {
          columns: 1, mdColumns: 2,
          "input:name": { label: "项目名称", "$value": "g.fields.name", placeholder: "my-project", onchange: "g.fields.name = String($event || '')" },
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
          "button:submit": { label: "提交", onclick: "g.submitForm()" },
          "button:cancel": { label: "取消", onclick: "g.reset()" }
        }
      },

      "callout:result": {
        "$if": "g.stage === 'result'",
        tone: "success",
        text: "AI：收到，正在为你创建项目..."
      },

      "code-block:toolresult": {
        "$if": "g.stage === 'result'",
        title: "ToolResult",
        language: "json",
        "$code": "g.result ? JSON.stringify(g.result, null, 2) : '// 提交后显示 ToolResult'"
      },

      "button:reset": {
        "$if": "g.stage === 'result'",
        label: "重新演示",
        onclick: "g.reset()"
      }
    }
  }
}
```

这个示例展示了 ToolHost 的完整流程：

1. **AI 发起提问** — callout 显示 AI 的请求
2. **用户点击按钮** — 触发 ToolHost 表单
3. **用户填写并提交** — 表单数据收集
4. **返回 ToolResult** — code-block 展示 JSON 格式的返回值
5. **AI 继续处理** — callout 显示 AI 的响应

---

Fallback：项目名称 my-project，类型 Web 应用，优先级中。AI 弹出表单收集信息，用户提交后 AI 继续处理。
