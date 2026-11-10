---
title: "Grid"
category: Layout
status: ready
order: 40
summary: "响应式等宽网格。适合同级卡片、指标、字段组。"
---

# Grid

按列数与 gap property 将 slot 子元素排成响应式网格。

## HTML 示例

```slex
<slex-grid></slex-grid>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `columns` | string / number | `1` | 基础列数。隔离文档宽度低于 640px 时强制为单列。 |
| `smColumns` / `sm-columns` | string / number | 未设置 | 隔离文档宽度从 640px 起使用的列数。 |
| `mdColumns` / `md-columns` | string / number | `auto` | 隔离文档宽度从 768px 起使用的列数；默认回退到 columns。 |
| `lgColumns` / `lg-columns` | string / number | 未设置 | 隔离文档宽度从 1024px 起使用的列数。 |
| `xlColumns` / `xl-columns` | string / number | 未设置 | 隔离文档宽度从 1280px 起使用的列数。 |
| `gap` | string | `1rem` | 作为网格间距的 CSS 长度；不支持无单位 token 整数。 |

插槽：默认插槽，接收普通 HTML 或自定义元素。

## 接口摘要

- 属性: `columns`, `sm-columns`, `md-columns`, `lg-columns`, `xl-columns`, `gap`
- Properties: `columns`, `smColumns`, `mdColumns`, `lgColumns`, `xlColumns`, `gap`
- Events: 无
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
