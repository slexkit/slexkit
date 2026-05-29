---
title: "Radio Group"
category: Input
status: ready
order: 70
summary: "互斥单选组。"
---
# Radio Group 单选组

互斥选项选择，适合少量选项的单选场景。

<!-- slex:spec-example:start component="radio-group" id="basic" sourceHash="4ad4aa38" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_radio_group_typical",
  "layout": {
    "radio-group:mode": {
      "label": "Mode",
      "icon": "sliders-horizontal",
      "value": "auto",
      "options": [
        {
          "label": "Auto",
          "value": "auto",
          "icon": "sparkle"
        },
        {
          "label": "Manual",
          "value": "manual",
          "icon": "wrench"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：模式选择、少量枚举、互斥配置项。
- 不适合：大量选项（应当用 select）。
- 关联组件：select 用于下拉单选，适合选项较多的场景。
- 选项数量建议控制在 2-5 个。
- 使用 $value 和 onchange 实现状态绑定。

## API 参考 {#api}

<!-- slex:spec-api:start component="radio-group" sourceHash="9770be28" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `value` | string | 否 | 是 |  | 当前选中值。 |
| `label` | string | 否 | 是 |  | 分组标签。 |
| `icon` | string | 否 | 否 |  | 显示在分组标签前的图标名称。 |
| `options` | array | 否 | 否 |  | 选项列表，包含 label、value 和可选 icon。 |
| `options[].icon` | string | 否 | 否 |  | 显示在单个选项标签前的图标名称。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用组内所有单选项。 |
| `orientation` | string: vertical, horizontal | 否 | 否 | `"vertical"` | 单选项布局方向。 |
| `haptic` | boolean | 否 | 否 | `true` | 在支持的设备上启用振动反馈。 |
| `haptics` | boolean | 否 | 否 | `true` | haptic 的别名。 |
| `name` | string | 否 | 否 |  | 选项共享的原生 radio group name。 |
| `onchange` | write-expression | 否 | 否 |  | 选择变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
