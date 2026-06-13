---
title: ToolHost 确认模板
category: AI 代理场景
status: published
order: 15
summary: AI 执行敏感操作前，用户在确认面板中查看详情并决定是否放行。
tags: toolhost, confirm, ai, agent
components: toolhost, card, callout, badge, section
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# ToolHost 确认模板

AI 要删除文件、发邮件、改配置——这些操作不该自动执行。ToolHost 的 confirm-action 模板把操作详情摊开，让用户看清楚再拍板。

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
          "stat:toolName": { label: "工具名称", "$value": "g.toolName" },
          "stat:args": { label: "参数", "$value": "JSON.stringify(g.toolArgs)" }
        }
      },
      "callout:warning": { tone: "warning", text: "此操作将删除文件，请确认是否执行。" },
      "grid:actions": {
        columns: 1, mdColumns: 2,
        "button:confirm": { label: "确认执行", onclick: "g.confirm()", "$disabled": "g.confirmed" },
        "button:reject": { label: "取消", onclick: "g.reject()", "$disabled": "g.confirmed" }
      },
      "callout:result": {
        "$tone": "g.result ? (g.result.includes('已删除') ? 'success' : 'info') : 'info'",
        "$text": "g.result || '等待用户操作...'"
      }
    }
  }
}
```

Fallback：确认后按钮禁用，底部显示结果。

## ToolHost 三种模板

| 模板 | 用途 | 典型场景 |
|------|------|----------|
| confirm-action | 确认/拒绝 | 删除文件、发送邮件、部署上线 |
| choose-options | 多选一 | 选择数据库、选择部署环境、选择模板 |
| fill-form | 填写表单 | 创建账户、配置服务、提交工单 |
