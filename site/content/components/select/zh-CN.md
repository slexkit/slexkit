---
title: "Select"
category: Input
status: ready
order: 20
summary: "单选下拉。"
---
# Select 下拉选择

单选下拉选择器，通过 options 定义可选列表，value 控制当前选中项。

<!-- slex:spec-example:start component="select" id="basic" sourceHash="b5675bcc" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_select_typical",
  "layout": {
    "select:env": {
      "label": "环境",
      "icon": "server",
      "value": "prod",
      "options": [
        {
          "label": "开发环境",
          "value": "dev",
          "icon": "code"
        },
        {
          "label": "生产环境",
          "value": "prod",
          "icon": "rocket-launch"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：枚举选择、配置项、环境选择。
- 不适合：互斥单选组（应当用 radio-group）。
- 关联组件：radio-group 用于选项较少的互斥选择。
- 配合 column 组成表单。
- 使用 $value 和 onchange 实现状态绑定。

## API 参考 {#api}

<!-- slex:spec-api:start component="select" sourceHash="44dbc082" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `label` | string | 否 | 是 |  | 选择器标签。 |
| `icon` | string | 否 | 否 |  | 显示在顶部标签前的图标名称。 |
| `value` | string | 否 | 是 |  | 当前选中值。 |
| `options` | array | 否 | 否 |  | 选项列表，包含 label、value 和可选 icon。 |
| `options[].icon` | string | 否 | 否 |  | 显示在选项标签前的图标名称。 |
| `placeholder` | string | 否 | 否 |  | 未选择值时显示的占位文本。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用选择器触发器和原生 select。 |
| `required` | boolean | 否 | 是 | `false` | 要求原生 select 使用非占位值。 |
| `variant` | string: default, toolbar | 否 | 否 | `"default"` | 选择器表面变体。 |
| `onchange` | write-expression | 否 | 否 |  | 选择变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
