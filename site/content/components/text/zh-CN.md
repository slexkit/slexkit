---
title: "Text"
category: Display
status: ready
order: 20
summary: "短文本输出，用于状态、说明、结果。"
---

# Text

从 `text`、`content` 或 `label` 展示纯文本，并可设置 variant、color 与 size。

## HTML 示例

```slex
<slex-text text="一段简短清晰的说明文字。"></slex-text>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | string | `""` | 主要文本内容；优先于 text 与 label。 |
| `text` | string | `""` | 备用文本字段。从 light DOM 推导的 content 即使为空也优先使用；建议使用 content 或元素文本。 |
| `label` | string | `""` | 备用标签字段；从 light DOM 推导的 content 优先使用，建议使用 content 或元素文本。 |
| `variant` | string | 未设置 | 添加对应的文本变体 class。 |
| `color` | string | `inherited` | CSS 颜色值；未设置时继承。 |
| `size` | string / number | `inherited` | CSS 字号；数值按像素解释。 |

## 接口摘要

- 属性: `content`, `text`, `label`, `variant`, `color`, `size`
- Properties: `content`, `text`, `label`, `variant`, `color`, `size`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
