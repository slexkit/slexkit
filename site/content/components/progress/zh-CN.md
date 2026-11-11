---
title: "Progress"
category: Feedback
status: ready
order: 10
summary: "进度条。"
---

# Progress

根据 `value` 展示确定进度，也可切换为不确定状态，并支持 label 与无障碍名称。

## HTML 示例

```slex
<slex-progress label="进度" value="65"></slex-progress>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | string | `""` | 控件的可见标签。 |
| `value` | string / number | `0` | 会限制在 0–100 范围内的百分比。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `indeterminate` | boolean | `false` | 移除数值型 ARIA 范围并标记为不定进度。 |
| `aria-label` | string | `auto` | 无障碍名称覆盖；省略时会在可用时使用可见标签。 |

## 接口摘要

- 属性: `label`, `value`, `icon`, `indeterminate`, `aria-label`
- Properties: `label`, `value`, `icon`, `indeterminate`, `aria-label`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
