---
title: "Section"
category: Layout
status: ready
order: 60
summary: "页面区块，带标题、动作和内容区域。"
---

# Section

创建带标题的内容区，可附加副标题与图标；正文通过默认 slot 传入。

## HTML 示例

```slex
<slex-section></slex-section>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | string | `""` | 分区标题。 |
| `subtitle` | string | `""` | 标题下方的辅助文本。 |
| `icon` | string | `""` | 标题图标；仅在存在 header 时渲染。 |

插槽：默认插槽，接收普通 HTML 或自定义元素。

## 接口摘要

- 属性: `title`, `subtitle`, `icon`
- Properties: `title`, `subtitle`, `icon`
- Events: 无
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
