---
title: "Checkbox"
category: Input
status: ready
order: 30
summary: "复选框，适合确认项或多选项。"
---
# Checkbox 复选框

布尔勾选输入，适合需要确认或从多项中选择的场景。

<!-- slex:spec-example:start component="checkbox" id="basic" sourceHash="060e0c05" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_checkbox_typical",
  "layout": {
    "checkbox:agree": {
      "checked": true,
      "label": "我同意",
      "icon": "handshake"
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：同意条款、多选设置、逐项启用/禁用。
- 不适合：即时生效的开关（应当用 switch）、互斥单选（应当用 radio-group）。
- 关联组件：switch 用于即时生效的开关，radio-group 用于互斥选项。
- 通常放在 column 中垂直排列多个选项。
- 使用 $checked 和 onchange 实现状态绑定。

### checked / disabled 变体

```slex
{
  namespace: "doc_checkbox_state_diff",
  layout: {
    "column:diff": {
      "checkbox:checked": {
        label: "已选中",
        checked: true
      },
      "checkbox:unchecked": {
        label: "未选中"
      },
      "checkbox:disabled-checked": {
        label: "禁用且已选",
        checked: true,
        disabled: true
      },
      "checkbox:disabled": {
        label: "已禁用",
        disabled: true
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="checkbox" sourceHash="a507c04a" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `checked` | boolean | 否 | 是 | `false` | 选中状态。 |
| `label` | string | 否 | 是 |  | 复选框标签。 |
| `icon` | string | 否 | 否 |  | 显示在可见标签前的图标名称。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用复选框。 |
| `haptic` | boolean | 否 | 否 | `true` | 在支持的设备上启用振动反馈。 |
| `haptics` | boolean | 否 | 否 | `true` | haptic 的别名。 |
| `onchange` | write-expression | 否 | 否 |  | 选中状态变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
