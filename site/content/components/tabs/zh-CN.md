---
title: "Tabs"
category: Navigation
status: ready
order: 10
summary: "同一上下文内切换视图。"
---

# Tabs

通过 `.value` 在命名 slot panel 或 `.tabs` 数组定义的页面间切换，并触发原生值事件。

## HTML 示例

```slex
<slex-tabs><section slot="overview" aria-label="Overview">Overview content</section><section slot="details" aria-label="Details">Details content</section></slex-tabs>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | scalar | `auto` | 选中的标签值。具名 light DOM 面板会推导 tabs 并选择首个可用面板；通过 property 提供 tabs 时需显式设置 value。 |
| `tabs` | array | `[]` | 仅 property；标签对象数组。具名 light DOM 面板可推导此数组并提供内容。 |
| `orientation` | string | `horizontal` | 标签列表方向。隔离文档宽度不超过 640px 时，vertical 会折叠为可横向滚动的列表。 |

事件：`input`、`change`。使用原生事件监听器；交互值从组件 property 读取。

插槽：具名面板（与条目名称对应）。

## 接口摘要

- 属性: `value`, `orientation`
- Properties: `value`, `tabs`, `orientation`
- Events: `input`, `change`
- Slots: `(named panels)`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
