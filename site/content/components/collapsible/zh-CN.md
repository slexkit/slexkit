---
title: "Collapsible"
category: Disclosure
status: ready
order: 20
summary: "单个可展开内容区域。"
---

# Collapsible

通过 `.open` 展开或隐藏一个 slot 内容区，并可设置触发文字与图标。

## HTML 示例

```slex
<slex-collapsible></slex-collapsible>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `open` | boolean | `false` | 当前展开状态。 |
| `trigger` | string | `"Toggle"` | 触发按钮标签。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `content` | string | `""` | 在面板中与默认插槽子元素一同渲染的文本。 |

事件：`input`、`change`。使用原生事件监听器；交互值从组件 property 读取。

插槽：默认插槽，接收普通 HTML 或自定义元素。

## 接口摘要

- 属性: `open`, `trigger`, `icon`, `content`
- Properties: `open`, `trigger`, `icon`, `content`
- Events: `input`, `change`
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
