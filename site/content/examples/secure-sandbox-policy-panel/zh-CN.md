---
title: 安全沙箱策略面板
category: 平台能力与安全运行时
status: draft
order: 51
summary: 把 secure runtime 的权限边界、宿主策略和人工确认放在一个可审阅面板中。
tags: sandbox, secure-runtime, policy
components: card, checkbox, progress, badge, table, callout
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 安全沙箱策略面板

SlexKit 的 secure runtime 适合渲染未审阅的模型输出、第三方 Markdown 或用户提交的 Slex source。关键不是“能不能渲染”，而是把权限边界、宿主策略和人工确认表达清楚。

```slex
{
  slex: "0.1",
  namespace: "example_secure_sandbox_policy_panel",
  g: {
    network: false,
    storage: false,
    tools: false,
    reviewed: true,
    risk: function () { return (this.network ? 30 : 0) + (this.storage ? 25 : 0) + (this.tools ? 35 : 0) + (this.reviewed ? 0 : 10); },
    mode: function () { if (this.risk() <= 25) return "低风险沙箱"; if (this.risk() <= 55) return "需要宿主策略确认"; return "高风险，建议阻断或人工复核"; }
  },
  layout: {
    "card:policy": {
      title: "Secure Runtime 权限策略",
      "callout:boundary": { tone: "info", title: "默认边界", text: "未审阅内容进入 sandbox iframe，网络、存储和工具调用都应由宿主 policy 显式授权。" },
      "checkbox:network": { label: "允许经 host policy 转发网络请求", "$checked": "g.network", onchange: "g.network = Boolean($event)" },
      "checkbox:storage": { label: "允许写入受限临时状态", "$checked": "g.storage", onchange: "g.storage = Boolean($event)" },
      "checkbox:tools": { label: "允许发起工具调用申请", "$checked": "g.tools", onchange: "g.tools = Boolean($event)" },
      "checkbox:reviewed": { label: "源码和 fallback 已人工审阅", "$checked": "g.reviewed", onchange: "g.reviewed = Boolean($event)" },
      "progress:risk": { label: "权限风险", "$value": "g.risk()" },
      "badge:mode": { "$label": "g.mode()", "$tone": "g.risk() <= 25 ? 'success' : g.risk() <= 55 ? 'warning' : 'danger'" },
      "table:boundaries": {
        columns: ["能力", "默认策略", "宿主责任"],
        rows: [
          ["DOM", "隔离在 iframe", "限制可见容器和销毁生命周期"],
          ["网络", "默认不直连", "通过 allowlist 与超时策略代理"],
          ["工具", "默认不执行", "转成审批事件而不是直接调用"]
        ]
      }
    }
  }
}
```

Fallback：未审阅内容应进入 secure runtime，权限由宿主策略逐项授权。
