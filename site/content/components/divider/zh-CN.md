---
title: "Divider"
category: Content
status: ready
order: 35
summary: "分割线，可带 label。"
---

# Divider

用分隔线区分相邻内容，并可附带 label 或图标。

## HTML 示例

```slex
<slex-divider label="详细信息"></slex-divider>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | string | `""` | 可选的居中分隔标签。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |

## 接口摘要

- 属性: `label`, `icon`
- Properties: `label`, `icon`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
