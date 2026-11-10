---
title: "Input"
category: Input
status: ready
order: 10
summary: "单行文本输入。"
---

# Input

通过 `.value` 收集文本、数字或工程单位输入；需要数值解析结果时读取 `.valueAsNumber`。

## HTML 示例

```slex
<slex-input id="value" label="项目" value="SlexKit" placeholder="输入项目名称" description="清晰的标签让表单字段更易浏览。"></slex-input>
```

## API 参考

默认值描述的是省略属性时的界面行为。布尔属性按是否存在判断：移除 `disabled` 才会启用输入，写成 `disabled="false"` 仍会禁用。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | string / number | `""` | 当前输入值。用户编辑后保留原始文本，也可通过 JavaScript 赋入数值。 |
| `valueAsNumber` | number | `NaN` | 只读 JavaScript property。工程模式解析单位前缀；空值或非法文本返回 `NaN`。 |
| `label` | string | `""` | 与原生输入框关联的可见标签。 |
| `description` | string | `""` | 输入框下方的辅助说明，通过 `aria-describedby` 关联。 |
| `placeholder` | string | `""` | 输入为空时显示的提示，建议同时保留可见标签。 |
| `type` | string | `text` | 原生输入类型，或支持 `4.7kΩ` 等值的 `engineering` 模式；工程模式使用文本输入。 |
| `unit` | string | `""` | 右侧单位标签，不会自动换算输入值。 |
| `disabled` | boolean | `false` | 禁止编辑，并退出原生表单提交。 |
| `readOnly` / `readonly` | boolean | `false` | 禁止编辑，仍可阅读并获得焦点。 |
| `required` | boolean | `false` | 启用原生必填校验。 |
| `invalid` | boolean | `false` | 标记非法状态；非空 `error` 也会触发此状态。 |
| `error` | string | `""` | 校验错误说明，通过 `aria-describedby` 关联。 |
| `name` | string | 未设置 | 参与原生表单时使用的字段名。 |
| `min` | string / number | 未设置 | 支持相应约束的原生输入类型的最小值。 |
| `max` | string / number | 未设置 | 支持相应约束的原生输入类型的最大值。 |
| `step` | string / number | 未设置 | 原生步长约束，也可在支持时使用 `any`。 |
| `aria-label` | string | 自动推导 | 覆盖无障碍名称；省略时由可见标签或 placeholder 提供名称。 |

在 `<slex-input>` 上监听原生 `input`、`change` 事件，通过 `event.currentTarget.value` 或 `.valueAsNumber` 读取结果。

## 接口摘要

- 属性: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `type`, `placeholder`, `readonly`, `required`, `invalid`, `error`, `min`, `max`, `step`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `type`, `placeholder`, `readOnly`, `required`, `invalid`, `error`, `min`, `max`, `step`
- Events: `input`, `change`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
