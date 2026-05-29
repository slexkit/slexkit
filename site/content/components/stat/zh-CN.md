---
title: "Stat"
category: Display
status: ready
order: 10
summary: "指标小卡片，展示 label、value、unit。"
---
# Stat 指标

紧凑的指标展示组件，包含标签、数值和可选的单位。

<!-- slex:spec-example:start component="stat" id="basic" sourceHash="9fa58aeb" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_stat_typical",
  "layout": {
    "grid:stats": {
      "columns": 2,
      "stat:requests": {
        "label": "Requests",
        "icon": "activity",
        "value": "1.2k",
        "unit": "/min"
      },
      "stat:success": {
        "label": "Success",
        "icon": "check-circle",
        "value": "98.4",
        "unit": "%",
        "tone": "success"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：数据看板、统计概览、关键指标展示。
- 不适合：长文本（应当用 text）、交互式输入（应当用 input）。
- 关联组件：text 用于文本输出，badge 用于标签状态。
- 通常放在 grid 或 row 中组合使用。
- tone 只表达语义状态，不作为任意样式选择器。

### tone 变体

```slex
{
  namespace: "doc_stat_tone_diff",
  layout: {
    "row:tones": {
      "stat:info": {
        label: "Info",
        value: "42",
        tone: "info"
      },
      "stat:success": {
        label: "Success",
        value: "98%",
        tone: "success"
      },
      "stat:warning": {
        label: "Warning",
        value: "73",
        tone: "warning"
      },
      "stat:danger": {
        label: "Danger",
        value: "5",
        tone: "danger"
      },
      "stat:muted": {
        label: "Muted",
        value: "0",
        tone: "muted"
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="stat" sourceHash="389443e6" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `label` | string | 否 | 是 |  | 指标标签。 |
| `icon` | string | 否 | 否 |  | 显示在标签前的图标名称。 |
| `value` | string \| number | 否 | 是 |  | 指标值。 |
| `unit` | string | 否 | 是 |  | 显示在值后的单位。 |
| `tone` | string: info, success, warning, danger, muted | 否 | 否 |  | 可选语义色调。 |
| `animateInitial` | boolean | 否 | 否 | `false` | 为初始渲染值播放动画。 |
<!-- slex:spec-api:end -->
