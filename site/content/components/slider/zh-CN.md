---
title: "Slider"
category: Input
status: ready
order: 60
summary: "数值范围输入。"
---

# Slider

提供带 min/max/step 与方向设置的有界数值控件，持续变化触发 `input`，确认变化触发 `change`。

## HTML 示例

```slex
<slex-slider label="音量" value="40" min="0" max="100" unit="%"></slex-slider>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | string | `""` | 控件的可见标签。 |
| `unit` | string | `""` | 组件支持时随值显示的单位文本。 |
| `description` | string | `""` | 为保持接口一致而暴露，但该组件目前不会渲染它。 |
| `disabled` | boolean | `false` | 禁用用户交互。 |
| `name` | string | 未设置 | 自定义元素参与原生表单时使用的字段名。 |
| `value` | number | `0` | 当前数值；浏览器会按范围与步长约束赋值。 |
| `aria-label` | string | `auto` | 无障碍名称覆盖；省略时会在可用时使用可见标签。 |
| `min` | string / number | `0` | 范围最小值。 |
| `max` | string / number | `100` | 范围最大值。 |
| `step` | string / number | `1` | 范围步长。 |
| `orientation` | string | `horizontal` | 设置方向数据标记；当前原生 range 与样式仍保持水平。 |
| `valueAsNumber` | number | `0` | 只读 JavaScript property，返回经浏览器范围限制与步长对齐后的当前数值。 |

事件：`input`、`change`。使用原生事件监听器；交互值从组件 property 读取。

## 接口摘要

- 属性: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `min`, `max`, `step`, `orientation`
- Properties: `label`, `unit`, `description`, `disabled`, `name`, `value`, `aria-label`, `min`, `max`, `step`, `orientation`
- Events: `input`, `change`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
