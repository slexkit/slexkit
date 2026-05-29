---
title: "Button"
category: Action
status: ready
order: 10
summary: "普通操作按钮。"
---
# Button 按钮

允许触发操作的按钮组件。

<!-- slex:spec-example:start component="button" id="basic" sourceHash="267bd8d1" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_button_typical",
  "layout": {
    "row:actions": {
      "button:save": {
        "label": "Save",
        "icon": "floppy-disk",
        "variant": "primary"
      },
      "button:cancel": {
        "label": "Cancel",
        "variant": "secondary"
      },
      "button:delete": {
        "label": "Delete",
        "variant": "danger"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：表单提交、确认操作、命令触发。
- `href` 会把按钮渲染为按钮外观的链接动作；普通正文跳转或导航链接仍应使用 `link`。
- `selected`、`active`、`pressed` 用于表达按钮图标状态和 pressed 元数据。
- 关联组件：link 用于跳转而非操作，submit 用于 ToolHost 提交流程。
- 多个按钮通常放在 row 中水平排列。
- variant 只表达操作语义，不作为任意样式选择器。

### variant 变体

```slex
{
  namespace: "doc_button_variant_diff",
  layout: {
    "row:variants": {
      "button:primary": {
        label: "Primary",
        variant: "primary"
      },
      "button:secondary": {
        label: "Secondary",
        variant: "secondary"
      },
      "button:danger": {
        label: "Danger",
        variant: "danger"
      },
      "button:ghost": {
        label: "Ghost",
        variant: "ghost"
      }
    }
  }
}
```

### disabled 禁用态

```slex
{
  namespace: "doc_button_disabled_diff",
  layout: {
    "row:disabled": {
      "button:enabled": {
        label: "Enabled"
      },
      "button:disabled": {
        label: "Disabled",
        disabled: true
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="button" sourceHash="11a5a574" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `label` | string | 否 | 是 |  | 按钮可见文本和无障碍名称。 |
| `icon` | string | 否 | 否 |  | 显示在标签前的图标名称。 |
| `iconOnly` | boolean | 否 | 否 | `false` | 只显示图标，同时保留标签作为无障碍名称。 |
| `variant` | string: primary, secondary, danger, ghost | 否 | 否 | `"primary"` | 操作语义变体。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用该操作。 |
| `href` | string | 否 | 是 |  | 将按钮表面渲染为指向该 URL 的链接。 |
| `target` | string | 否 | 否 |  | 存在 href 时使用的链接 target。 |
| `title` | string | 否 | 是 |  | 工具提示和无障碍标签回退文本。 |
| `selected` | boolean | 否 | 是 |  | 以选中视觉状态渲染图标。 |
| `active` | boolean | 否 | 是 |  | 以激活视觉状态渲染图标。 |
| `pressed` | boolean | 否 | 是 |  | 暴露按下状态并渲染选中图标样式。 |
| `onclick` | write-expression | 否 | 否 |  | 按钮点击时执行的写表达式。 |
<!-- slex:spec-api:end -->
