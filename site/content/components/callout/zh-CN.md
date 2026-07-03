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
      "title": "提示",
      "icon": "info",
      "text": "用提示块突出需要注意的信息。"
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
        title: "信息",
        text: "这是一条说明信息。"
      },
      "callout:success": {
        tone: "success",
        title: "成功",
        text: "操作已完成。"
      },
      "callout:warning": {
        tone: "warning",
        title: "警告",
        text: "继续前请复核。"
      },
      "callout:danger": {
        tone: "danger",
        title: "危险",
        text: "此操作无法撤销。"
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
