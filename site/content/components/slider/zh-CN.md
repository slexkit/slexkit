---
title: "Slider"
category: Input
status: ready
order: 60
summary: "数值范围输入。"
---
# Slider 滑块

数值范围选择，支持 min、max、step 控制和单位展示。

<!-- slex:spec-example:start component="slider" id="basic" sourceHash="a0525d92" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_slider_typical",
  "layout": {
    "slider:volume": {
      "label": "Volume",
      "icon": "speaker-high",
      "value": 42,
      "min": 0,
      "max": 100,
      "step": 1,
      "unit": "%"
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：音量、亮度、阈值、百分比等数值调节。
- 不适合：精确文本输入（应当用 input）。
- 关联组件：input 用于文本输入。
- 使用 $value 和 onchange 实现状态绑定。

## API 参考 {#api}

<!-- slex:spec-api:start component="slider" sourceHash="0939dc16" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `label` | string | 否 | 是 |  | 滑块标签。 |
| `icon` | string | 否 | 否 |  | 显示在标签前的图标名称。 |
| `value` | number | 否 | 是 | `0` | 当前数值。 |
| `min` | number | 否 | 是 | `0` | 最小值。 |
| `max` | number | 否 | 是 | `100` | 最大值。 |
| `step` | number | 否 | 是 | `1` | 步进间隔。 |
| `unit` | string | 否 | 是 |  | 显示在值后的单位。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用范围输入。 |
| `orientation` | string: horizontal, vertical | 否 | 否 | `"horizontal"` | 用于样式的滑块方向元数据。 |
| `haptic` | boolean | 否 | 否 | `true` | 在支持的设备上启用振动反馈。 |
| `haptics` | boolean | 否 | 否 | `true` | haptic 的别名。 |
| `onchange` | write-expression | 否 | 否 |  | 数值变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
