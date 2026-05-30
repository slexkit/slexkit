---
title: PRD 范围矩阵
category: 产品与协作
status: published
order: 41
summary: 用交互矩阵表达本期范围、排除项和验收边界。
tags: prd, scope, product
components: card, checkbox, progress, callout
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# PRD 范围矩阵

PRD 里列了 20 个功能，哪些是本期要做的？哪些明确不做？说"不"和说"是"同样重要。

勾选本期要做的模块，看范围负载如何变化：

```slex
{
  slex: "0.1",
  namespace: "example_prd_scope_matrix",
  g: { search: true, export: true, billing: false, admin: false, score: function () { return [this.search, this.export, this.billing, this.admin].filter(Boolean).length; } },
  layout: {
    "card:scope": {
      title: "PRD 范围矩阵",
      "checkbox:search": { label: "知识库搜索体验", "$checked": "g.search", onchange: "g.search = Boolean($event)" },
      "checkbox:export": { label: "示例 Markdown 导出", "$checked": "g.export", onchange: "g.export = Boolean($event)" },
      "checkbox:billing": { label: "商业化计费", "$checked": "g.billing", onchange: "g.billing = Boolean($event)" },
      "checkbox:admin": { label: "企业管理后台", "$checked": "g.admin", onchange: "g.admin = Boolean($event)" },
      "progress:scope": { label: "本期范围", "$value": "g.score() / 4 * 100" },
      "callout:boundary": { tone: "warning", text: "PRD 应同时记录入选项和排除项，避免默认膨胀。" }
    }
  }
}
```

进度条是个负载指示器——全勾就 100%，健康的迭代通常只放 2-3 个核心模块。勾太多说明要么范围失控，要么需要拆分迭代。

**为什么需要"排除项"？** 不标注排除 = 默认纳入。团队成员在开发过程中会自行扩展范围，这是 Scope Creep 的根源。显式说"本期不做计费和管理后台"比什么都不说安全得多。

Fallback：本期范围包含搜索和导出，不包含计费和管理后台。PRD 应同时记录入选项和排除项。
