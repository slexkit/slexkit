---
title: "ToolHost 表单模板"
category: "AI 代理场景"
status: published
order: 17
summary: "使用 fill-form 模板构建信息收集表单"
tags: toolhost, fill-form, ai, agent
components: toolhost, card, callout, badge, section, grid, input, select
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# ToolHost 表单模板

AI 需要收集用户信息来完成任务时（如创建账户、配置服务、提交工单），ToolHost 的 fill-form 模板提供了标准化的表单界面，支持输入框、下拉选择等表单控件。

---

## 信息收集表单

```slex
{
  slex: "0.1",
  namespace: "toolhost_fill_form",
  g: {
    formTitle: "创建新项目",
    fields: {
      name: "",
      description: "",
      type: "web",
      priority: "medium"
    },
    submitted: false,
    submit: function () {
      if (this.fields.name && this.fields.description) {
        this.submitted = true;
      }
    }
  },
  layout: {
    "section:form": {
      eyebrow: "ToolHost · 表单模板",
      title: "信息收集表单",
      subtitle: "AI 需要收集用户信息来完成任务。",
      "callout:formTitle": {
        tone: "info",
        "$text": "g.formTitle"
      },
      "grid:fields": {
        columns: 1, mdColumns: 2,
        "input:name": {
          label: "项目名称",
          "$value": "g.fields.name",
          placeholder: "请输入项目名称",
          onchange: "g.fields.name = String($event)"
        },
        "input:description": {
          label: "项目描述",
          "$value": "g.fields.description",
          placeholder: "请输入项目描述",
          onchange: "g.fields.description = String($event)"
        },
        "select:type": {
          label: "项目类型",
          "$value": "g.fields.type",
          options: [
            { label: "Web 应用", value: "web" },
            { label: "移动应用", value: "mobile" },
            { label: "API 服务", value: "api" }
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
      "button:submit": {
        label: "提交",
        onclick: "g.submit()",
        "$disabled": "g.submitted || !g.fields.name || !g.fields.description"
      },
      "callout:result": {
        "$tone": "g.submitted ? 'success' : 'info'",
        "$text": "g.submitted ? '项目创建成功！' : '请填写所有必填字段'"
      }
    }
  }
}
```

必填字段（名称和描述）为空时，提交按钮为禁用状态。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
