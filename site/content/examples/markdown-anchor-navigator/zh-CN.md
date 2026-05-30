---
title: 穿越式 Markdown 交互文档
category: 平台能力与安全运行时
status: draft
order: 54
summary: 在同一篇 Markdown 的开头、中段和末尾插入多个 Slex fence，并共享同一个文档状态。
tags: markdown, artifact, state
components: card, select, slider, stat, table, checkbox, badge, callout
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 穿越式 Markdown 交互文档

“穿越式”不是跳转到某个锚点，而是一篇普通 Markdown 文档在多个位置嵌入 Slex。开头的控制条、中段的证据检查、末尾的结论卡共享同一个 `namespace`，因此读者在文档中任何位置修改状态，其他交互块都会跟着更新。

## 1. 开头：先建立阅读状态

下面这个 Slex fence 出现在文章开头。它负责设置当前阅读目标和初始置信度，但它不是整篇文档的唯一交互。

```slex
{
  slex: "0.1",
  namespace: "example_markdown_cross_document",
  g: {
    chapter: "evidence",
    confidence: 62,
    evidenceChecked: false,
    decisionAccepted: false,
    chapterLabel: function () { if (this.chapter === "context") return "背景"; if (this.chapter === "decision") return "结论"; return "证据"; },
    score: function () { return Math.min(100, this.confidence + (this.evidenceChecked ? 18 : 0) + (this.decisionAccepted ? 10 : 0)); },
    verdict: function () { if (this.score() >= 85) return "可以形成结论"; if (this.score() >= 70) return "可以给出谨慎结论"; return "还需要补充证据"; }
  },
  layout: {
    "card:reading_state": {
      title: "文档阅读状态",
      "select:chapter": { label: "当前关注章节", "$value": "g.chapter", options: [{ label: "背景", value: "context" }, { label: "证据", value: "evidence" }, { label: "结论", value: "decision" }], onchange: "g.chapter = String($event)" },
      "slider:confidence": { label: "初始置信度", "$value": "g.confidence", min: 0, max: 100, step: 1, unit: "%", onchange: "g.confidence = Number($event)" },
      "stat:score": { label: "当前综合分", "$value": "g.score()", unit: "%" },
      "badge:focus": { "$label": "'正在阅读：' + g.chapterLabel()", tone: "info" }
    }
  }
}
```

Fallback：开头交互用于建立阅读状态；普通 Markdown 环境仍能继续阅读正文。

## 2. 中段：证据区继续使用同一份状态

这一段仍然是普通 Markdown。它可以包含列表、引用、代码块或公式；中间的 Slex fence 只负责把“是否已经核验证据”写回同一个文档状态。

| 证据 | 命中点 | 说明 |
| ---- | ---- | ---- |
| `security-runtime` | sandbox iframe | 未审阅内容应隔离 |
| `integration` | artifact scope | 同一文档共享状态域 |
| `quick-start` | fallback | 非交互环境仍可读 |

```slex
{
  slex: "0.1",
  namespace: "example_markdown_cross_document",
  layout: {
    "card:evidence": {
      title: "证据检查",
      "table:evidence": {
        columns: ["检查项", "状态"],
        rows: [
          ["运行时边界", "已定位 secure runtime 说明"],
          ["文档状态域", "同一 namespace 可跨 fence 复用"],
          ["降级文本", "每个交互块后保留 fallback"]
        ]
      },
      "checkbox:evidence": { label: "我已核验证据表", "$checked": "g.evidenceChecked", onchange: "g.evidenceChecked = Boolean($event)" },
      "progress:score": { label: "综合分", "$value": "g.score()" },
      "callout:hint": { "$tone": "g.evidenceChecked ? 'success' : 'warning'", "$text": "g.evidenceChecked ? '证据区已确认，末尾结论会同步更新。' : '还没有确认中段证据，末尾结论应保持谨慎。'" }
    }
  }
}
```

Fallback：证据区应保留静态表格；交互状态只是增强核验流程。

## 3. 末尾：结论区读取前文交互结果

文章末尾的 Slex fence 没有重新声明 `g`，但它可以读取开头和中段共同维护的状态。这个模式适合 AI 生成长报告：正文仍是 Markdown，关键判断、核验和行动项可以穿插成多个小交互。

```slex
{
  slex: "0.1",
  namespace: "example_markdown_cross_document",
  layout: {
    "card:decision": {
      title: "结论确认",
      "badge:verdict": { "$label": "g.verdict()", "$tone": "g.score() >= 85 ? 'success' : g.score() >= 70 ? 'warning' : 'danger'" },
      "checkbox:accepted": { label: "接受当前结论", "$checked": "g.decisionAccepted", onchange: "g.decisionAccepted = Boolean($event)" },
      "stat:final_score": { label: "最终分", "$value": "g.score()", unit: "%" },
      "callout:next": { "$tone": "g.decisionAccepted ? 'success' : 'info'", "$text": "g.decisionAccepted ? '结论已接受，可以生成行动项。' : '结论仍可回到开头或中段继续调整。'" }
    }
  }
}
```

Fallback：末尾结论可静态阅读；支持 SlexKit 的宿主会把前文交互状态穿透到这里。
