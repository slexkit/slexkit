---
title: "Toast"
category: Feedback
status: ready
order: 20
summary: "临时通知。"
---
# Toast 通知

展示临时通知，支持语义类型区分消息性质。

<!-- slex:spec-example:start component="toast" id="basic" sourceHash="1cab367e" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_toast_typical",
  "layout": {
    "toast:saved": {
      "type": "success",
      "title": "已保存",
      "icon": "check-circle",
      "description": "更改已写入。"
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：保存成功、操作错误、状态变更通知。
- 不适合：需要用户响应或长时间停留的消息（应放进页面内表单或 callout）。
- 关联组件：callout 用于页面内提示块，badge 用于紧凑状态。
- 需要自动消失时设置 duration；否则它作为页面内通知卡展示。
- type 只表达语义消息性质。

### type 变体

```slex
{
  namespace: "doc_toast_type_diff",
  layout: {
    "column:types": {
      "toast:info": {
        type: "info",
        title: "信息",
        description: "A new update is available."
      },
      "toast:success": {
        type: "success",
        title: "成功",
        description: "操作已完成。"
      },
      "toast:warning": {
        type: "warning",
        title: "警告",
        description: "继续前请复核。"
      },
      "toast:danger": {
        type: "danger",
        title: "错误",
        description: "出现错误。"
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="toast" sourceHash="854ea3a2" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `title` | string | 否 | 是 |  | 通知标题。 |
| `heading` | string | 否 | 是 |  | title 的别名。 |
| `label` | string | 否 | 是 |  | title 的别名。 |
| `icon` | string | 否 | 否 |  | 显示在通知左侧的图标名称。 |
| `description` | string | 否 | 是 |  | 通知正文文本。 |
| `text` | string | 否 | 是 |  | description 的别名。 |
| `message` | string | 否 | 是 |  | description 的别名。 |
| `content` | string | 否 | 是 |  | description 的别名。 |
| `type` | string: info, success, warning, danger | 否 | 否 | `"info"` | 通知语义类型。 |
| `tone` | string: info, success, warning, danger | 否 | 否 | `"info"` | type 的别名。 |
| `duration` | number | 否 | 否 |  | 自动隐藏延迟，单位毫秒。 |
| `dismissable` | boolean | 否 | 否 | `true` | 显示关闭按钮。 |
| `dismissible` | boolean | 否 | 否 | `true` | dismissable 的别名。 |
| `closeLabel` | string | 否 | 否 | `"Close notification"` | 无障碍关闭按钮标签。 |
| `closeAriaLabel` | string | 否 | 否 |  | closeLabel 的别名。 |
<!-- slex:spec-api:end -->
