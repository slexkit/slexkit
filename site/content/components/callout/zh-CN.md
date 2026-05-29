---
title: "Callout"
category: Content
status: ready
order: 40
summary: "提示块，用于说明、注意、警告、建议。"
---
# Callout 提示块

醒目的提示区块，支持标题、正文和语义色调。

<!-- slex:spec-example:start component="callout" id="basic" sourceHash="e07c6bdd" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_callout_typical",
  "layout": {
    "callout:notice": {
      "tone": "info",
      "title": "Notice",
      "icon": "info",
      "text": "Use callout for information that should stand out."
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：操作说明、注意警告、成功提示、建议信息。
- 不适合：纯状态标签（应当用 badge）、需要独立流程的交互内容（应拆成页面内区域）。
- 关联组件：badge 紧凑标签，toast 临时反馈。
- 子组件可嵌套在 callout 内扩展正文区域。
- tone 只表达语义状态，不作为任意样式选择器。

### tone 变体

```slex
{
  namespace: "doc_callout_tone_diff",
  layout: {
    "column:tones": {
      "callout:info": {
        tone: "info",
        title: "Info",
        text: "This is an informational message."
      },
      "callout:success": {
        tone: "success",
        title: "Success",
        text: "Operation completed successfully."
      },
      "callout:warning": {
        tone: "warning",
        title: "Warning",
        text: "Please review before proceeding."
      },
      "callout:danger": {
        tone: "danger",
        title: "Danger",
        text: "This action cannot be undone."
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="callout" sourceHash="aed6ad17" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `title` | string | 否 | 是 |  | 提示块标题。 |
| `heading` | string | 否 | 是 |  | title 的别名。 |
| `label` | string | 否 | 是 |  | title 的别名。 |
| `icon` | string | 否 | 否 |  | 显示在标题前的图标名称。 |
| `text` | string | 否 | 是 |  | 提示块正文文本。 |
| `message` | string | 否 | 是 |  | text 的别名。 |
| `content` | string | 否 | 是 |  | text 的别名。 |
| `tone` | string: info, success, warning, danger | 否 | 否 | `"info"` | 提示块的语义色调。 |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
