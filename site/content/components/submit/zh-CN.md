---
title: "Submit"
category: Tooling
status: ready
order: 20
summary: "ToolHost 专用提交动作，把当前选择或表单值返回宿主。"
---

# Submit

为 ToolHost 类工作流提供明确的 `submit` 与 `ignore` 操作；它不是原生表单提交按钮的替代品。

## HTML 示例

```slex
<slex-submit></slex-submit>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `submitLabel` / `submit-label` | string | `"Submit"` | 主要提交按钮标签。 |
| `ignoreLabel` / `ignore-label` | string | `"Ignore"` | 次要忽略按钮标签。 |
| `disabled` | boolean | `false` | 仅禁用提交按钮；Ignore 仍可用。 |

事件：`submit`、`ignore`。使用原生事件监听器；交互值从组件 property 读取。

## 接口摘要

- 属性: `submit-label`, `ignore-label`, `disabled`
- Properties: `submitLabel`, `ignoreLabel`, `disabled`
- Events: `submit`, `ignore`
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
