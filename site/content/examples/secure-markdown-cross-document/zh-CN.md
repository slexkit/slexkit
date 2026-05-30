---
title: Secure 穿越式 Markdown 文档
category: 平台能力与安全运行时
status: draft
order: 60
summary: 在 secure runtime 中把同一篇 Markdown 的多个 Slex fence 合成为一个沙箱 artifact。
tags: sandbox, markdown, artifact
components: card, slider, checkbox, stat, badge, callout
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# Secure 穿越式 Markdown 文档

这个示例强调沙箱版本的穿越式交互：同一篇 Markdown 的多个 `slex` fence 不应各自创建孤立沙箱，而应由 `createSlexKitMarkdownRuntimeHost({ mode: "secure" })` 合成为一个 secure artifact。这样可以共享状态，同时仍把未审阅内容限制在 iframe 和 host policy 里。

## 开头：沙箱内建立状态

```slex
{
  slex: "0.1",
  namespace: "example_secure_cross_document",
  g: {
    confidence: 58,
    reviewed: false,
    accepted: false,
    score: function () { return Math.min(100, this.confidence + (this.reviewed ? 22 : 0) + (this.accepted ? 10 : 0)); },
    verdict: function () { return this.score() >= 80 ? "沙箱内结论可提交" : "需要继续审阅"; }
  },
  layout: {
    "card:start": {
      title: "Secure Artifact 状态",
      "slider:confidence": { label: "模型初始置信度", "$value": "g.confidence", min: 0, max: 100, step: 1, unit: "%", onchange: "g.confidence = Number($event)" },
      "stat:score": { label: "沙箱内综合分", "$value": "g.score()", unit: "%" },
      "callout:policy": { tone: "info", text: "多个 fence 共享一个 secure artifact，但网络和工具调用仍由宿主 policy 控制。" }
    }
  }
}
```

Fallback：开头交互用于建立沙箱内状态；普通 Markdown 环境显示静态说明。

## 中段：沙箱内继续修改状态

```slex
{
  slex: "0.1",
  namespace: "example_secure_cross_document",
  layout: {
    "card:middle": {
      title: "证据审阅",
      "checkbox:reviewed": { label: "证据表已审阅", "$checked": "g.reviewed", onchange: "g.reviewed = Boolean($event)" },
      "badge:reviewed": { "$label": "g.reviewed ? '已审阅' : '未审阅'", "$tone": "g.reviewed ? 'success' : 'warning'" },
      "callout:boundary": { "$tone": "g.reviewed ? 'success' : 'warning'", "$text": "g.reviewed ? '中段状态会穿透到末尾结论。' : '末尾结论仍会保持谨慎。'" }
    }
  }
}
```

Fallback：中段保留证据审阅说明；交互不可用时不影响正文阅读。

## 末尾：沙箱内读取前文状态

```slex
{
  slex: "0.1",
  namespace: "example_secure_cross_document",
  layout: {
    "card:end": {
      title: "沙箱结论",
      "badge:verdict": { "$label": "g.verdict()", "$tone": "g.score() >= 80 ? 'success' : 'warning'" },
      "checkbox:accepted": { label: "接受沙箱内结论", "$checked": "g.accepted", onchange: "g.accepted = Boolean($event)" },
      "stat:final": { label: "最终分", "$value": "g.score()", unit: "%" }
    }
  }
}
```

Fallback：secure host 会把多个 fence 合成一个沙箱 artifact；普通 Markdown 读者仍能看到每段解释。
