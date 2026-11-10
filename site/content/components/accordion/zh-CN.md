---
title: "Accordion"
category: Disclosure
status: ready
order: 10
summary: "多项折叠面板，适合 FAQ 或分组详情。"
---

# Accordion

把命名 panel 组织成可展开的折叠列表；数据驱动时设置 `.items`/`.value`，需要同时展开多项时使用 `multiple`。

## HTML 示例

```slex
<slex-accordion></slex-accordion>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | scalar / array | 未设置 | 展开项的值；multiple 为 true 时使用值数组。 |
| `items` | array | `[]` | 仅 property；项目对象数组。具名 light DOM 面板会推导 items，并覆盖对应项目的文本内容。 |
| `multiple` | boolean | `false` | 允许多个项目同时保持展开。 |

事件：`input`、`change`。使用原生事件监听器；交互值从组件 property 读取。

插槽：具名面板（与条目名称对应）。

## 接口摘要

- 属性: `value`, `multiple`
- Properties: `value`, `items`, `multiple`
- Events: `input`, `change`
- Slots: `(named panels)`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
