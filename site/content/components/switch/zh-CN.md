---
title: "Switch"
category: Input
status: ready
order: 40
summary: "开关型布尔输入。"
---

# Switch

通过 `.enabled`/`.checked` 表示开关设置，并触发原生 `input`/`change` 事件。

## HTML 示例

```slex
<slex-switch></slex-switch>
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
| `value` | string / number | `"on"` | 启用时提交的值；未赋入 value 时提交 on。通过 enabled 或 checked 控制状态。 |
| `aria-label` | string | `auto` | 无障碍名称覆盖；省略时会在可用时使用可见标签。 |
| `checked` | boolean | `false` | enabled 的别名；包装层会同步两者状态。 |
| `enabled` | boolean | `false` | 当前开关状态；与 checked 同步。 |

事件：`input`、`change`。使用原生事件监听器；交互值从组件 property 读取。

## 接口摘要

- 属性: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `checked`, `enabled`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `checked`, `enabled`
- Events: `input`, `change`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
