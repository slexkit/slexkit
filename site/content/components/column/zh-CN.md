---
title: "Column"
category: Layout
status: ready
order: 20
summary: "垂直排列子组件。适合表单、说明文字、控制组。"
---

# Column

使用组件布局样式将 slot 子元素纵向排列。

## HTML 示例

```slex
<slex-column>
  <slex-stat label="电压" value="12" unit="V"></slex-stat>
  <slex-stat label="电流" value="2" unit="A"></slex-stat>
</slex-column>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `default` (slot) | Node[] | 空 | 放入普通 HTML 或其他自定义元素，按列纵向排列；没有组件专属属性。 |

## 接口摘要

- 属性: 无
- Properties: 无
- Events: 无
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
