---
title: "Row"
category: Layout
status: ready
order: 30
summary: "横向排列子组件。适合工具栏、状态行、按钮组。"
---

# Row

指标卡片或内容卡片自动均衡排列；混合内容使用 flex 行，可配置 gap、对齐与分布方式。

## HTML 示例

```slex
<slex-row>
  <slex-stat label="供电电压" value="12" unit="V"></slex-stat>
  <slex-stat label="测量电流" value="2.5" unit="A"></slex-stat>
  <slex-stat label="计算输出功率" value="30" unit="W"></slex-stat>
</slex-row>
```

两个及以上的直接子元素均为 `slex-stat`，或均为 `slex-card` 时，自动按容器宽度均衡分列，末行铺满，同行卡片等高。标签换行时，指标值仍在底部对齐。调整宽度、重排、增删时保留子元素实例和数值。显式设置 `align` 或 `justify` 可使用普通 flex 布局；需要指定列数时使用 Grid。

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `gap` | string | `1rem` | 子元素之间的 CSS 长度；不支持无单位 token 整数。 |
| `align` | string | `stretch` | CSS align-items 值。省略时，同类 stat/card 自动均衡分列并保持同行等高；显式 align 或 justify 使用普通 flex 布局。 |
| `justify` | string | `normal` | CSS justify-content 值。 |

插槽：默认插槽，接收普通 HTML 或自定义元素。

## 接口摘要

- 属性: `gap`, `align`, `justify`
- Properties: `gap`, `align`, `justify`
- Events: 无
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
