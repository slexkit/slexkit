---
title: "AI 代理工具审批"
category: "聊天消息场景"
status: published
order: 7
summary: "展示 AI 代理工具调用的审批流程，用户可以批准或拒绝 AI 的操作请求。"
tags: ai, agent, approval, toolhost
components: section, card, callout, badge, checkbox, button
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 代理工具审批

这是聊天消息场景中的典型应用：**AI 代理工具调用的审批流程**。

当 AI 需要执行敏感操作时（如发送邮件、修改配置、删除数据），需要用户批准。这个示例展示了如何用 SlexKit 构建一个审批界面。

---

## 工具调用审批

```slex
{
  slex: "0.1",
  namespace: "agent_tool_approval",
  g: {
    toolName: "sendEmail",
    toolArgs: { to: "user@example.com", subject: "报告已生成", body: "您的报告已准备好，请查看附件。" },
    approved: false,
    rejected: false,
    result: null,
    approve: function () {
      this.approved = true;
      this.result = "已批准：邮件将发送至 " + this.toolArgs.to;
    },
    reject: function () {
      this.rejected = true;
      this.result = "已拒绝：操作已取消";
    }
  },
  layout: {
    "section:approval": {
      eyebrow: "AI 代理 · 工具审批",
      title: "工具调用审批",
      subtitle: "AI 请求执行敏感操作，需要您的批准。",
      "card:toolInfo": {
        title: "工具信息",
        "callout:details": {
          tone: "info",
          "$text": "'工具：' + g.toolName + '\\n目标：' + g.toolArgs.to + '\\n内容：' + g.toolArgs.subject"
        }
      },
      "callout:warning": {
        tone: "warning",
        text: "此操作将发送邮件，请确认是否执行。"
      },
      "grid:actions": {
        columns: 1, mdColumns: 2,
        "button:approve": {
          label: "批准执行",
          onclick: "g.approve()",
          "$disabled": "g.approved || g.rejected"
        },
        "button:reject": {
          label: "拒绝",
          onclick: "g.reject()",
          "$disabled": "g.approved || g.rejected"
        }
      },
      "callout:result": {
        "$tone": "g.approved ? 'success' : g.rejected ? 'danger' : 'info'",
        "$text": "g.result || '等待您的决策...'"
      }
    }
  }
}
```

**关键点：**
- 展示 AI 代理工具调用的审批流程
- 用户可以批准或拒绝 AI 的操作请求
- 审批状态的实时反馈
- 适合需要人工确认的敏感操作

---

### Fallback 文本

如果不支持 SlexKit，上面的代码块会显示为普通代码块，用户可以看到原始的 DSL 定义。这就是"Markdown 原生"的意义——降级优雅，不影响阅读。
