---
title: "Select"
category: Input
status: ready
order: 20
summary: "单选下拉。"
---

# Select

提供下拉选择控件，以 `.options` 数组定义选项，并通过 `.value` 跟踪当前选择。

## HTML 示例

```slex
<slex-select label="Environment"><option value="dev">Development</option><option value="prod">Production</option></slex-select>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | string | `""` | 控件的可见标签。 |
| `unit` | string | `""` | 为保持接口一致而暴露，但该组件目前不会渲染它。 |
| `description` | string | `""` | 为保持接口一致而暴露，但该组件目前不会渲染它。 |
| `disabled` | boolean | `false` | 禁用用户交互。 |
| `name` | string | 未设置 | 自定义元素参与原生表单时使用的字段名。 |
| `value` | string / number | `""` | 已选选项值。使用 light DOM option 子元素时会推导首个可用值；通过 property 提供 options 时不会自动选择。 |
| `aria-label` | string | `auto` | 未提供可见标签时使用的无障碍名称。 |
| `options` | array | `[]` | 仅 property；{ label, value, disabled, icon } 选项对象数组；也会从 light DOM option 子元素推导。 |
| `placeholder` | string | `"Select..."` | 未选择选项时显示的文本。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `variant` | string | `default` | 视觉变体；toolbar 启用紧凑工具栏样式。 |
| `required` | boolean | `false` | 要求提供值以通过原生表单校验。 |

事件：`input`、`change`。使用原生事件监听器；交互值从组件 property 读取。

## 接口摘要

- 属性: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `placeholder`, `icon`, `variant`, `required`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `options`, `placeholder`, `icon`, `variant`, `required`
- Events: `input`, `change`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
