---
title: "Formula 公式"
category: Display
status: ready
order: 11
summary: "响应式 KaTeX 公式显示。"
---

# Formula 公式

根据 `tex` 渲染公式；`display-mode` 用于选择块级而非行内展示。

## HTML 示例

```slex
<slex-formula tex="E = mc^2"></slex-formula>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tex` | string | `""` | TeX 源码；为空时渲染无害的间距公式。 |
| `displayMode` / `display-mode` | boolean | `true` | 默认使用 KaTeX 展示模式。将 displayMode property 赋为 false 可切换到行内模式；省略属性则恢复展示模式。 |

## 接口摘要

- 属性: `tex`, `display-mode`
- Properties: `tex`, `displayMode`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
