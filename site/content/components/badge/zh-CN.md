---
title: "Badge"
category: Content
status: ready
order: 10
summary: "紧凑标签，用于状态、分类、轻量元信息。"
---
# Badge 标签

紧凑的状态标签组件，通过 tone 表达语义颜色。

<!-- slex:spec-example:start component="badge" id="basic" sourceHash="0f5f8aba" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_badge_typical",
  "layout": {
    "row:badges": {
      "badge:ready": {
        "label": "ready",
        "icon": "check-circle",
        "tone": "success"
      },
      "badge:pending": {
        "label": "pending",
        "tone": "warning"
      },
      "badge:info": {
        "label": "info",
        "tone": "info"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：状态指示（成功/警告/错误）、分类标签、计数标记。
- 不适合：长文本标签（应当用 callout）、交互式按钮（应当用 button）。
- 关联组件：callout 用于带标题的消息块，stat 用于数值指标。
- 多个 badge 通常放在 row 中水平排列。
- tone 只表达语义状态，不作为任意样式选择器。

### tone 变体

```slex
{
  namespace: "doc_badge_tone_diff",
  layout: {
    "row:tones": {
      "badge:info": {
        label: "info",
        tone: "info"
      },
      "badge:success": {
        label: "success",
        tone: "success"
      },
      "badge:warning": {
        label: "warning",
        tone: "warning"
      },
      "badge:danger": {
        label: "danger",
        tone: "danger"
      },
      "badge:muted": {
        label: "muted",
        tone: "muted"
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="badge" sourceHash="5621b8b3" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `label` | string | 否 | 是 |  | 标签文本。 |
| `text` | string | 否 | 是 |  | label 的别名。 |
| `content` | string | 否 | 是 |  | label 的别名。 |
| `icon` | string | 否 | 否 |  | 显示在 badge 标签前的图标名称。 |
| `tone` | string: info, success, warning, danger, muted | 否 | 否 | `"info"` | 应用到 badge 的语义色调。 |
| `variant` | string: info, success, warning, danger, muted | 否 | 否 |  | tone 的别名。 |
<!-- slex:spec-api:end -->
