---
title: "Callout"
category: Content
status: ready
order: 40
summary: "提示块，用于说明、注意、警告、建议。"
---

# Callout

突出展示带标题的说明或警告内容，可设置 tone 与图标；复杂正文通过默认 slot 传入。

## HTML 示例

```slex
<slex-callout title="提示" tone="info">继续之前请保存更改。</slex-callout>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | string | `""` | 可选提示框标题。 |
| `content` | string | `""` | 主要正文文本，与默认插槽子元素一同渲染。 |
| `description` | string | `""` | 未设置 content 时使用的后备正文。 |
| `tone` | string | `info` | 语义色调；error 与 destructive 会归一化为 danger。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |

插槽：默认插槽，接收普通 HTML 或自定义元素。

## 接口摘要

- 属性: `title`, `content`, `description`, `tone`, `icon`
- Properties: `title`, `content`, `description`, `tone`, `icon`
- Events: 无
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
