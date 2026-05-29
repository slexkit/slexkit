---
title: "Collapsible"
category: Disclosure
status: ready
order: 20
summary: "单个可展开内容区域。"
---
# Collapsible 折叠区

管理单个内容的展开/收起状态，适合辅助详情或次级信息。

<!-- slex:spec-example:start component="collapsible" id="basic" sourceHash="d074a138" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_collapsible_typical",
  "layout": {
    "collapsible:more": {
      "open": true,
      "trigger": "Details",
      "icon": "caret-circle-down",
      "content": "This secondary content can be collapsed."
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：详情展开、补充说明、可折叠的辅助信息。
- 不适合：多项折叠列表（应当用 accordion）。
- 关联组件：accordion 用于多项折叠面板。
- 子组件可扩展默认正文内容。
- 使用 $value 和 onchange 实现受控展开。

## API 参考 {#api}

<!-- slex:spec-api:start component="collapsible" sourceHash="7580b7c4" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `open` | boolean | 否 | 是 | `false` | 展开状态。 |
| `trigger` | string | 否 | 是 |  | 触发按钮文本。 |
| `icon` | string | 否 | 否 |  | 显示在触发文本前的图标名称。 |
| `content` | string | 否 | 是 |  | 静态正文内容。 |
| `onchange` | write-expression | 否 | 否 |  | 展开状态变化时执行的写表达式。 |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
