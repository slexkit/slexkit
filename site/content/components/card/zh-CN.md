---
title: "Card"
category: Layout
status: ready
order: 50
summary: "分组容器。用于把一组相关内容放在卡片表面里。"
---

# Card

在带标题的表面中组合相关内容，可配置图标、tone 与 variant；子内容通过默认 slot 传入。

## HTML 示例

```slex
<slex-card title="运行指标" icon="chart-bar">
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;">
    <slex-stat label="请求数" value="1.2k" unit="/min"></slex-stat>
    <slex-stat label="延迟" value="42" unit="ms"></slex-stat>
  </div>
</slex-card>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | string | `""` | 默认插槽内容上方的可选标题。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `tone` | string | 未设置 | 供主题样式使用的色调数据值。 |
| `variant` | string | 未设置 | 展示变体数据值。 |

插槽：默认插槽，接收普通 HTML 或自定义元素。

## 接口摘要

- 属性: `title`, `icon`, `tone`, `variant`
- Properties: `title`, `icon`, `tone`, `variant`
- Events: 无
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
