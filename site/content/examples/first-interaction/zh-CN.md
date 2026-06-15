---
title: "第一个交互：滑块操控数据"
category: "入门教程"
status: published
order: 2
summary: "在 SlexKit 卡片引入 g 对象和第一个滑块交互，体验响应式数据绑定。"
tags: beginner, reactive, slider
components: section, slider, stat, callout, badge, column
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 第一个交互：滑块操控数据

上一节全是静态数据。要让 UI "活起来"，需要三样东西：

1. **`g` 对象** — 响应式状态容器
2. **`$value` / `$label` / `$tone`** — 读表达式（从 g 取值渲染）
3. **`onchange`** — 写表达式（用户操作写入 g）

```slex
{
  slex: "0.1",
  namespace: "learn_first_interaction",
  g: { count: 42 },
  layout: {
    "section:interact": {
      eyebrow: "入门教程 · 2/4",
      title: "第一个交互：滑块操控数据",
      subtitle: "滑动下面的滑块，stat 和 callout 会跟着变。这就是 SlexKit 的响应式核心。",
      "column:controls": {
        "slider:count": {
          label: "选择数值",
          "$value": "g.count",
          min: 0,
          max: 100,
          step: 1,
          onchange: "g.count = Number($event)"
        },
        "stat:count": { label: "当前数值", "$value": "g.count" },
        "badge:level": {
          "$label": "g.count < 30 ? '低' : g.count < 70 ? '中' : '高'",
          "$tone": "g.count < 30 ? 'success' : g.count < 70 ? 'warning' : 'danger'"
        },
        "callout:note": {
          "$tone": "g.count < 50 ? 'success' : 'info'",
          "$text": "g.count < 50 ? '当前值偏低，适合入门级负载。' : '当前值偏高，注意监控资源消耗。'"
        }
      }
    }
  }
}
```

核心公式：
```
用户操作 → onchange → g → SlexKit 检测变化 → 所有 $value/$tone/$text 自动重算 → UI 更新
```

这就是**单向数据流** + **响应式重渲染**。不需要手动 `setState`，不需要 DOM 操作。
