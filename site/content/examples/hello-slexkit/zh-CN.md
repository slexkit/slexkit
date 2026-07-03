---
title: "第一个 SlexKit 卡片"
category: "入门教程"
status: published
order: 1
summary: "静态 SlexKit 卡片示例，使用 section、grid、stat、table 和 callout 组织内容。"
tags: beginner, static, overview
components: section, grid, stat, table, callout
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 第一个 SlexKit 卡片

该示例不使用 `g` 对象或交互，只用 `layout` 声明一张静态卡片。

```slex
{
  slex: "0.1",
  namespace: "learn_hello_slexkit",
  layout: {
    "section:hello": {
      eyebrow: "入门教程 · 1/4",
      title: "第一个 SlexKit 卡片",
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
        text: "标题、数值、表格和颜色都来自上面的 DSL 声明，不需要额外 HTML。Markdown 承载正文，DSL 承载交互结构。"
      }
    }
  }
}
```

先观察结构、组件 key 和嵌套方式。下一节会在同样的结构里加入响应式数据。

---


如果 `"12,847"` 需要动态计算，就需要把数据放进 `g` 对象，并用表达式读取。
