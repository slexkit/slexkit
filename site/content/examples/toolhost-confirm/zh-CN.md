---
title: "ToolHost 确认模板"
category: "AI 代理场景"
status: published
order: 15
summary: "使用 confirm-action 模板构建工具调用确认界面"
tags: toolhost, confirm, ai, agent
components: toolhost, card, callout, badge, section
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# ToolHost 确认模板

AI 执行删除文件、发送邮件等敏感操作前，通常需要用户确认。ToolHost 的 confirm-action 模板提供了标准化的确认界面，包含操作详情、警告提示和确认/取消按钮。

---

## 工具调用确认

```slex
{
  slex: "0.1",
  namespace: "toolhost_confirm",
  g: {
    toolName: "deleteFile",
    toolArgs: { path: "/tmp/old-data.csv", recursive: false },
    confirmed: false,
    result: null,
    confirm: function () {
      this.confirmed = true;
      this.result = "文件已删除: " + this.toolArgs.path;
    },
    reject: function () {
      this.confirmed = true;
      this.result = "操作已取消";
    }
  },
  layout: {
    "section:toolCall": {
      eyebrow: "ToolHost · 确认模板",
      title: "工具调用确认",
      subtitle: "AI 请求执行敏感操作，需要用户确认。",
      "card:toolInfo": {
        title: "工具信息",
        "grid:details": {
          columns: 1, mdColumns: 2,
          "stat:toolName": {
            label: "工具名称",
            "$value": "g.toolName"
          },
          "stat:args": {
            label: "参数",
            "$value": "JSON.stringify(g.toolArgs)"
          }
        }
      },
      "callout:warning": {
        tone: "warning",
        text: "此操作将删除文件，请确认是否执行。"
      },
      "grid:actions": {
        columns: 1, mdColumns: 2,
        "button:confirm": {
          label: "确认执行",
          onclick: "g.confirm()",
          "$disabled": "g.confirmed"
        },
        "button:reject": {
          label: "取消",
          onclick: "g.reject()",
          "$disabled": "g.confirmed"
        }
      },
      "callout:result": {
        "$tone": "g.result ? (g.result.includes('已删除') ? 'success' : 'info') : 'info'",
        "$text": "g.result || '等待用户操作...'"
      }
    }
  }
}
```

确认或取消后，按钮变为禁用状态，底部显示操作结果。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
