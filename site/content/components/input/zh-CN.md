---
title: "Input"
category: Input
status: ready
order: 10
summary: "单行文本输入。"
---
# Input 输入框

单行文本输入框，支持受控值、占位符、前后描述、原生类型、工程数值输入和禁用状态。

<!-- slex:spec-example:start component="input" id="basic" sourceHash="4215f98a" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_input_typical",
  "layout": {
    "input:name": {
      "label": "Project",
      "value": "SlexKit",
      "placeholder": "Enter name",
      "description": "Visible labels keep form fields scannable."
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：名称输入、搜索框、邮箱/密码等单行文本。
- 适合：用 `type: "engineering"` 输入 `4.7k`、`2.2uF`、`1e-3` 这类工程数值。
- 不适合：数值范围选择（应当用 slider）。
- 关联组件：select 用于选项选择，slider 用于数值范围。
- 通常放在 column 中组成表单。
- 使用 $value 和 onchange 实现状态绑定。
- 数值和工程输入只显示原生输入框；范围调节应使用 `slider`，不再提供自绘递减/递增按钮。
- `onchange` 会在用户输入时触发。
- `type: "number"` 仍然输出字符串；需要数值时在表达式中使用 `Number($event)`，或使用 `type: "engineering"` 读取解析后的 `number`。
- 使用 `invalid` 配合 `error` 展示校验错误，错误文本会通过 `aria-describedby` 关联到输入框。

### label 和 unit

`label` 会渲染为可点击的原生 label；`unit` 会贴在输入框尾部，适合电压、电阻、频率等带单位的输入。

```slex
{
  namespace: "doc_input_label_unit",
  layout: {
    "input:voltage": {
      label: "Voltage",
      value: "3.3",
      unit: "V",
      description: "Supply rail"
    }
  }
}
```

### disabled 禁用态

```slex
{
  namespace: "doc_input_disabled_diff",
  layout: {
    "row:diff": {
      "input:enabled": {
        value: "Editable",
        placeholder: "Type here"
      },
      "input:disabled": {
        value: "Disabled",
        disabled: true
      }
    }
  }
}
```

### engineering 工程输入

`type: "engineering"` 使用文本输入框，不使用浏览器原生 `number` 类型。组件状态保留原始字符串，并额外暴露解析结果：

```slex
{
  namespace: "doc_input_engineering",
  layout: {
    "input:resistance": {
      type: "engineering",
      value: "4.7kΩ"
    },
    "stat:parsed": {
      label: "Parsed value",
      $value: "resistance.valid ? resistance.number : 'Invalid'",
      $unit: "resistance.unit"
    }
  }
}
```

支持科学计数法和 SI 前缀：`p`、`n`、`u`、`µ`、`m`、`k`、`K`、`M`、`meg`、`G`、`T`。单位只做捕获，不做物理维度换算。

## API 参考 {#api}

<!-- slex:spec-api:start component="input" sourceHash="a1afe57e" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `value` | string | 否 | 是 |  | 当前输入值。 |
| `label` | string | 否 | 是 |  | 输入框标签。 |
| `unit` | string | 否 | 是 |  | 尾随单位文本。 |
| `description` | string | 否 | 是 |  | 输入框下方的辅助说明。 |
| `help` | string | 否 | 是 |  | description 的别名。 |
| `hint` | string | 否 | 是 |  | description 的别名。 |
| `error` | string | 否 | 是 |  | 显示在输入框下方并通过 aria-describedby 关联的错误文本。 |
| `errorMessage` | string | 否 | 是 |  | error 的别名。 |
| `invalid` | boolean | 否 | 是 | `false` | 使用 aria-invalid 和错误样式标记输入框无效。 |
| `placeholder` | string | 否 | 否 |  | 空值时显示的占位文本。 |
| `type` | string | 否 | 否 | `"text"` | 输入值类型；engineering 用于解析工程数值。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用编辑。 |
| `readonly` | boolean | 否 | 是 | `false` | 将输入框设为只读。 |
| `readOnly` | boolean | 否 | 是 | `false` | readonly 的别名。 |
| `required` | boolean | 否 | 是 | `false` | 将输入框标记为必填。 |
| `id` | string | 否 | 否 |  | 原生 input id；默认从组件名称派生稳定 id。 |
| `name` | string | 否 | 否 |  | 原生 input name 属性。 |
| `min` | string \| number | 否 | 是 |  | 数值输入控件使用的最小值。 |
| `max` | string \| number | 否 | 是 |  | 数值输入控件使用的最大值。 |
| `step` | string \| number | 否 | 是 |  | 数值输入控件使用的步进值。 |
| `onchange` | write-expression | 否 | 否 |  | 数值变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
