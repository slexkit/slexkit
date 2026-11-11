---
title: "Toast"
category: Feedback
status: ready
order: 20
summary: "临时通知。"
---

# Toast

展示短暂反馈，可设置标题、说明、tone、图标、时长与关闭行为；关闭时触发 `close`。

## HTML 示例

```slex
<slex-toast title="已保存" description="更改已保存。" tone="success"></slex-toast>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | string | `""` | Toast 标题。 |
| `description` | string | `""` | Toast 正文。 |
| `tone` | string | `info` | 语义色调；error 与 destructive 会归一化为 danger。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `duration` | string / number | `0` | 自动关闭延迟（毫秒）；零或非法值会保持显示。 |
| `dismissable` | boolean | `true` | 显示关闭控件。公开 property 的拼写为 dismissable。 |

事件：`close`。使用原生事件监听器；交互值从组件 property 读取。

## 接口摘要

- 属性: `title`, `description`, `tone`, `icon`, `duration`, `dismissable`
- Properties: `title`, `description`, `tone`, `icon`, `duration`, `dismissable`
- Events: `close`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
