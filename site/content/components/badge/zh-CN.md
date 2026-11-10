---
title: "Badge"
category: Content
status: ready
order: 10
summary: "紧凑标签，用于状态、分类、轻量元信息。"
---

# Badge

用紧凑标签展示状态或分类文字，并可配置图标、tone 与视觉 variant。

## HTML 示例

```slex
<slex-badge></slex-badge>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | string | `""` | 主要徽标文本。 |
| `text` | string | `""` | 备用徽标文本；从 light DOM 推导的 label 优先使用，建议使用 label 或元素文本。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `tone` | string | `neutral` | 徽标色调；danger 与 error 会归一化为 destructive。 |
| `variant` | string | `neutral` | 仅在 tone 未设置时使用的后备色调别名。 |

## 接口摘要

- 属性: `label`, `text`, `icon`, `tone`, `variant`
- Properties: `label`, `text`, `icon`, `tone`, `variant`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
