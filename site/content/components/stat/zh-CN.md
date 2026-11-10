---
title: "Stat"
category: Display
status: ready
order: 10
summary: "指标小卡片，展示 label、value、unit。"
---

# Stat

展示带标签的指标值，并可配置单位、图标、tone 与首次动画。

## HTML 示例

```slex
<slex-row>
  <slex-stat id="calculated" label="计算值" unit="V"></slex-stat>
  <slex-stat label="指定精度" value="1.000" unit="ms"></slex-stat>
</slex-row>
<script type="module">
  slex.root.querySelector("#calculated").value = Math.PI;
</script>
```

数值显示最多保留六位有效数字，并按可用宽度调整，必要时使用科学计数法。格式化只影响显示，`.value` 仍保留原值。较短的格式化字符串（如 `"1.000"`）保留末尾零，过长的小数字符串也可自适应；整数字符串和编号按原文保留，空间不足时显示省略号。悬停提示和无障碍文本可读取包含单位的完整内容。

RTL 页面中的数值仍按从左到右的顺序显示；文本值使用浏览器的自动方向和原生连写排版。

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | string | `""` | 控件的可见标签。 |
| `value` | string / number | `""` | 数值显示最多六位有效数字，并按可用宽度调整；不改变 value 原值。保留较短的格式化字符串，完整值可通过悬停提示与无障碍文本读取。 |
| `unit` | string | `""` | 显示在值之后的单位。 |
| `icon` | string | `""` | 已注册的图标名称；为空时不渲染图标。 |
| `tone` | string | 未设置 | 供主题样式使用的色调数据值。 |
| `animateInitial` / `animate-initial` | boolean | `false` | 首次渲染时让数字从零开始动画。 |

## 接口摘要

- 属性: `label`, `value`, `unit`, `icon`, `tone`, `animate-initial`
- Properties: `label`, `value`, `unit`, `icon`, `tone`, `animateInitial`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
