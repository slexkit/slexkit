---
title: "Link"
category: Content
status: ready
order: 25
summary: "链接或轻量跳转动作。"
---
# Link 链接

文本链接导航。

<!-- slex:spec-example:start component="link" id="basic" sourceHash="cf9f6896" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_link_typical",
  "layout": {
    "column:links": {
      "link:docs": {
        "href": "/components",
        "icon": "arrow-square-out",
        "text": "查看组件"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：页面导航、外部跳转、文本内嵌链接。
- 不适合：主要操作按钮（应当用 button）。
- 关联组件：button 用于显式操作触发。
- 链接文本保持简短。

## API 参考 {#api}

<!-- slex:spec-api:start component="link" sourceHash="7404dc9d" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `href` | string | 否 | 否 |  | 目标 URL。 |
| `text` | string | 否 | 是 |  | 可见链接文本。 |
| `label` | string | 否 | 是 |  | text 的别名。 |
| `content` | string | 否 | 是 |  | text 的别名。 |
| `icon` | string | 否 | 否 |  | 显示在链接文本前的图标名称。 |
| `target` | string | 否 | 否 |  | 原生链接 target 属性。 |
| `variant` | string: default, muted | 否 | 否 | `"default"` | 链接视觉变体。 |
<!-- slex:spec-api:end -->
