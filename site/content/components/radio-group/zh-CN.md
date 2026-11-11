---
title: "Radio Group"
category: Input
status: ready
order: 70
summary: "互斥单选组。"
---

# Radio Group

从 `.options` 数组中提供单项选择，通过 `.value` 暴露结果并触发原生值事件。

## HTML 示例

```slex
<slex-radio-group label="环境" value="dev">
  <option value="dev">开发</option>
  <option value="prod">生产</option>
</slex-radio-group>
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
| `value` | string / number | `""` | 已选选项值。通过 property 提供或从 light DOM 推导的选项都不会自动选择值。 |
| `aria-label` | string | `auto` | 未提供可见标签时使用的无障碍名称。 |
| `options` | array | `[]` | 仅 property；{ label, value, description, disabled, icon } 选项对象数组；也会从 light DOM option 子元素推导。 |
| `orientation` | string | `vertical` | 布局方向；horizontal 会将选项放入可换行横排。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `variant` | string | 未设置 | 视觉变体；list 会将选项渲染为卡片式列表。 |
| `required` | boolean | `false` | 要求提供值以通过原生表单校验。 |

事件：`input`、`change`。使用原生事件监听器；交互值从组件 property 读取。

## 接口摘要

- 属性: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `orientation`, `icon`, `variant`, `required`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `options`, `orientation`, `icon`, `variant`, `required`
- Events: `input`, `change`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
