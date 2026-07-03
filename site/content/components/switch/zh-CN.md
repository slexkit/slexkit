---
title: "Switch"
category: Input
status: ready
order: 40
summary: "开关型布尔输入。"
---
# Switch 开关

开关型布尔输入，适合即时启用的设置项。

<!-- slex:spec-example:start component="switch" id="basic" sourceHash="9c7b3bda" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_switch_typical",
  "layout": {
    "switch:feature": {
      "enabled": true,
      "label": "启用同步",
      "icon": "arrows-clockwise"
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：功能开关、偏好启用/禁用、即时生效的设置。
- 不适合：确认型勾选（应当用 checkbox）。
- 关联组件：checkbox 用于确认项或多选。
- 通常放在 row 或 column 中使用。
- 使用 $enabled 和 onchange 实现状态绑定。

### enabled / not available 变体

```slex
{
  namespace: "doc_switch_state_diff",
  layout: {
    "row:diff": {
      "switch:enabled": {
        label: "已启用",
        enabled: true
      },
      "switch:disabled": {
        label: "已禁用"
      },
      "switch:enabled-not-available": {
        label: "Enabled (not available)",
        enabled: true,
        disabled: true
      },
      "switch:disabled-not-available": {
        label: "Disabled (not available)",
        disabled: true
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="switch" sourceHash="27367ad0" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `enabled` | boolean | 否 | 是 | `false` | 启用状态。 |
| `label` | string | 否 | 是 |  | 开关标签。 |
| `icon` | string | 否 | 否 |  | 显示在可见标签前的图标名称。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用开关。 |
| `haptic` | boolean | 否 | 否 | `true` | 在支持的设备上启用振动反馈。 |
| `haptics` | boolean | 否 | 否 | `true` | haptic 的别名。 |
| `onchange` | write-expression | 否 | 否 |  | 启用状态变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
