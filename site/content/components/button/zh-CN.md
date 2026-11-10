---
title: "Button"
category: Action
status: ready
order: 10
summary: "普通操作按钮。"
---

# Button

提供触发原生 `click` 的操作控件，可配置 label、图标、variant、disabled、pressed 与 selected 状态。

## HTML 示例

```slex
<slex-button id="action" label="Run"></slex-button>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | string | `""` | 可见按钮文本；省略时从元素文本内容推导。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `variant` | string | `primary` | 视觉变体，例如 primary、secondary、danger 或 ghost。 |
| `disabled` | boolean | `false` | 禁用用户交互。 |
| `pressed` | boolean | `false` | 用于图标粗细与 aria-pressed 的按下状态。 |
| `selected` | boolean | `false` | 视觉选中状态；单独设置时不会添加 aria-pressed。 |
| `title` | string | `""` | 原生提示文本；可见标题请使用 label 或元素文本。 |
| `aria-label` | string | `auto` | 无障碍名称覆盖；省略时会在可用时使用可见标签。 |

事件：`click`。使用原生事件监听器；交互值从组件 property 读取。

## 接口摘要

- 属性: `label`, `icon`, `variant`, `disabled`, `pressed`, `selected`, `title`, `aria-label`
- Properties: `label`, `icon`, `variant`, `disabled`, `pressed`, `selected`, `title`, `aria-label`
- Events: `click`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
