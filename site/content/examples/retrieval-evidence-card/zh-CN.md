---
title: 检索答案证据卡
category: AI 与 Agent 工作流
status: published
order: 2
summary: 把 RAG 答案、引用、置信度和证据缺口放在同一个可读界面中。
tags: rag, evidence, answer
components: card, badge, progress, table, callout
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 检索答案证据卡

RAG 最容易出问题的地方不是检索本身，而是**证据边界不清**——模型生成的答案看起来很自信，但背后的证据可能只覆盖了部分主张。

例如，模型可能建议"采用 secure runtime 渲染未审阅的模型输出"——这个建议需要有证据支撑。

拖动置信度滑块，看证据充分性判断如何变化：

```slex
{
  slex: "0.1",
  namespace: "example_retrieval_evidence_card",
  g: { confidence: 82, selected: "policy", enough: function () { return this.confidence >= 75; } },
  layout: {
    "card:answer": {
      title: "答案与证据",
      "badge:source": { "$label": "'证据集：' + g.selected", tone: "info" },
      "progress:confidence": { label: "证据置信度", "$value": "g.confidence" },
      "slider:adjust": { label: "人工校准置信度", "$value": "g.confidence", min: 0, max: 100, step: 1, unit: "%", onchange: "g.confidence = Number($event)" },
      "table:evidence": { columns: ["来源", "命中点", "用途"], rows: [["security.md", "sandbox iframe", "运行边界"], ["integration.md", "runtime host", "宿主接入"], ["spec.md", "explicit fence", "语法边界"]] },
      "callout:gap": { "$tone": "g.enough() ? 'success' : 'warning'", "$text": "g.enough() ? '证据足够，可以给出结论。' : '证据不足，应继续检索或降低回答强度。'" }
    }
  }
}
```

证据表格是关键——每一行记录一条证据的**来源**、**命中点**（它支持了什么主张）和**用途**。逐条审视，判断是否存在"主张未被支撑"的缺口。

置信度阈值设在 75%。低于这条线，callout 会从"证据足够"切换为"应继续检索"——宁可少说，不能瞎说。

| 置信度 | 回答策略 |
|:---:|:---|
| ≥ 85% | 直接给结论，附完整引用链 |
| 60%–84% | 给结论但加限定条件 |
| < 60% | 仅提供参考，不作断言 |

Fallback：证据质量应包含来源、命中点和用途，置信度不足时应降低回答强度。
