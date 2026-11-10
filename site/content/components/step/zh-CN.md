---
title: "ToolHost Step"
category: Tooling
status: ready
order: 21
summary: "ToolHost 专用步骤页，用于在一次 function call 里逐步收集多段用户输入。"
---

# ToolHost Step

展示工作流中的一个步骤，可设置标题、说明、序号/总数、状态、进度及 slot 详情。

## HTML 示例

```slex
<slex-step></slex-step>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | string | `""` | 步骤标题。 |
| `description` | string | `""` | 标题下方的辅助文本。 |
| `index` | string / number | 未设置 | 当前步骤序号；未设置 total 时单独显示。 |
| `total` | string / number | 未设置 | 步骤总数，与 index 一起显示为 index/total。 |
| `state` | string | 未设置 | 供主题样式使用的状态数据值。 |
| `progress` | string / number | `""` | 显式进度标签；非空时优先于 index 与 total。 |

插槽：默认插槽，接收普通 HTML 或自定义元素。

## 接口摘要

- 属性: `title`, `description`, `index`, `total`, `state`, `progress`
- Properties: `title`, `description`, `index`, `total`, `state`, `progress`
- Events: 无
- Slots: `default`

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
