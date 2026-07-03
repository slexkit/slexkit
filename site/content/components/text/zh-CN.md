---
title: "Text"
category: Display
status: ready
order: 20
summary: "短文本输出，用于状态、说明、结果。"
---
# Text 文本

输出文本内容，适合状态提示、说明文字和结果展示。

<!-- slex:spec-example:start component="text" id="basic" sourceHash="bd63ce36" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_text_typical",
  "layout": {
    "text:status": {
      "text": "系统正常"
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：状态文本、短说明、标签值、轻量输出。
- 不适合：长文段落、结构化数据（应当用 table）。
- 关联组件：stat 用于数值指标，badge 用于状态标签。
- 文本长度建议简短，长文可使用多个 text 组合。
- 通常放在 row、column 或 card 内使用。

## API 参考 {#api}

<!-- slex:spec-api:start component="text" sourceHash="745fea9a" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `text` | string | 否 | 是 |  | 显示文本。 |
| `content` | string | 否 | 是 |  | text 的别名。 |
| `label` | string | 否 | 是 |  | text 的别名。 |
| `variant` | string: default, muted | 否 | 否 | `"default"` | 文本视觉变体。 |
| `color` | string | 否 | 是 |  | 受控预览使用的可选 CSS 颜色。 |
| `size` | string \| number | 否 | 是 |  | 可选字号。数字会按 px 处理。 |
| `class` | string | 否 | 否 |  | 额外的宿主控制 CSS 类。 |
<!-- slex:spec-api:end -->
