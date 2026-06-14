---
title: "你的第一个 SlexKit 卡片"
category: "入门教程"
status: published
order: 1
summary: "零交互、纯展示的静态卡片，展示 SlexKit 声明式 DSL 的渲染效果。"
tags: beginner, static, overview
components: section, grid, stat, table, callout
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 你的第一个 SlexKit 卡片

SlexKit 的核心思想：**用声明式 JSON 描述 UI，而不仅是 Markdown**。下面是一个纯静态的卡片——没有 `g` 对象，没有交互，所有内容都直接写在结构中。

```slex
{
  slex: "0.1",
  namespace: "learn_hello_slexkit",
  layout: {
    "section:hello": {
      eyebrow: "入门教程 · 1/4",
      title: "你的第一个 SlexKit 卡片",
      subtitle: "所有内容都是声明式的——数字、颜色、布局，全部来自 DSL。",
      "grid:top-stats": {
        columns: 1, mdColumns: 3,
        "stat:users": { label: "活跃用户", value: "12,847", unit: "人" },
        "stat:uptime": { label: "正常运行", value: "99.97", unit: "%" },
        "stat:latency": { label: "服务延迟", value: "42", unit: "ms" }
      },
      "table:pricing": {
        columns: ["功能", "免费版", "专业版"],
        rows: [
          ["可用组件", "全部", "全部"],
          ["自定义主题", "3 种", "无限"],
          ["数据导出", "JSON", "JSON / CSV / SQL"]
        ]
      },
      "callout:tip": {
        tone: "info",
        text: "你现在看到的每一样东西——标题、数值、表格、颜色——都来自上面的 DSL 声明，没有一行 HTML。这就是 SlexKit 的核心理念：Markdown 提供叙事，DSL 提供交互。"
      }
    }
  }
}
```

只看不动，感受一下结构和布局语法。下一节我们给卡片加上第一条响应式数据。

---

Fallback：静态卡片，所有数据直接写在 DSL 中。无交互，纯展示。

思考：如果 `"12,847"` 需要从里面计算出来，显然直接写死字符串不够。这就需要引入 **`g` 对象**——下一节的主角。
