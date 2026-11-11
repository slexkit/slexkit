---
title: "Link"
category: Content
status: ready
order: 25
summary: "链接或轻量跳转动作。"
---

# Link

根据 `href`、text/label、target、图标与 variant 渲染链接；在隔离文档内仍受 URL 策略约束。

## HTML 示例

```slex
<slex-link text="查看入门指南" href="/zh-CN/docs/guides/quick-start"></slex-link>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | string | `""` | 主要可见链接文本。 |
| `label` | string | `""` | 备用标签字段；从 light DOM 推导的 text 优先使用，建议使用 text 或元素文本。 |
| `href` | string | `"#"` | 目标 URL；可执行 URL scheme 会替换为 #。 |
| `target` | string | 未设置 | 浏览上下文目标；_blank 会同时添加 noreferrer。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `variant` | string | 未设置 | 供主题样式使用的变体数据值。 |

## 接口摘要

- 属性: `text`, `label`, `href`, `target`, `icon`, `variant`
- Properties: `text`, `label`, `href`, `target`, `icon`, `variant`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
