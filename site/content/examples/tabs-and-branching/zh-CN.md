---
title: "分支与切换：用 tabs 管理多视图"
category: "入门教程"
status: published
order: 4
summary: "用 tabs + select 实现场景切换，展示 UI = f(state) 的分支渲染模式。"
tags: tabs, select, branching, conditional
components: section, tabs, select, input, slider, stat, callout, badge, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 分支与切换：用 tabs 管理多视图

上一节是一个场景内的协同。现实中有多个场景需要在同一空间内切换——这时候用 **tabs** 和 **select**。

核心思想：**UI = f(state)**。切换 `mode` 状态变量，整个视图区域自动切换。

```slex
{
  slex: "0.1",
  namespace: "learn_tabs_branching",
  g: {
    mode: "length",
    value: 100, unit: "cm",
    convert: function () {
      if (this.mode === "length") return this.value + " " + this.unit;
      if (this.mode === "weight") return this.value * 2.20462 + " 磅 (lbs)";
      if (this.mode === "temp") return (this.value * 9 / 5 + 32).toFixed(1) + " °F";
      return "—";
    },
    label: function () {
      if (this.mode === "length") return "厘米转米";
      if (this.mode === "weight") return "公斤转磅";
      return "摄氏度转华氏度";
    }
  },
  layout: {
    "section:branching": {
      eyebrow: "学习路径 · 4/6",
      title: "分支与切换：模式选择器",
      subtitle: "切换下面的模式，输入的参数和计算结果会跟着变化。一种模式 = 一种 UI 状态。",
      "select:mode": {
        label: "转换模式",
        "$value": "g.mode",
        options: [
          { label: "长度 (cm → m)", value: "length" },
          { label: "重量 (kg → lbs)", value: "weight" },
          { label: "温度 (°C → °F)", value: "temp" }
        ],
        onchange: "g.mode = String($event)"
      },
      "input:value": { label: "输入值", "$value": "g.value", type: "number", onchange: "g.value = Number($event || 0)" },
      "stat:result": { "$label": "g.label()", "$value": "g.convert()" },
      "callout:guide": {
        "$tone": "g.mode === 'temp' ? 'warning' : 'info'",
        "$text": "g.mode === 'length' ? '1 米 = 100 厘米，除以 100 即可。' : g.mode === 'weight' ? '1 公斤 ≈ 2.20462 磅。' : '°F = °C × 9/5 + 32。华氏度范围更大，注意精度。'"
      }
    }
  }
}
```

---

还可以用 **tabs** 代替 select 来切换，特别是当选项较少且有详细的描述文字时：

```slex
{
  slex: "0.1",
  namespace: "learn_tabs_example",
  g: { tab: "overview" },
  layout: {
    "card:demo-tabs": {
      title: "Tabs 切换示例",
      "tabs:main": {
        "$value": "g.tab",
        tabs: [
          { value: "overview", label: "概览" },
          { value: "detail", label: "详情" },
          { value: "compare", label: "对比" }
        ],
        onchange: "g.tab = String($event)"
      },
      "stat:selected": { "$label": "'当前 Tab'", "$value": "g.tab" },
      "callout:content": {
        "$tone": "g.tab === 'compare' ? 'warning' : 'info'",
        "$text": "g.tab === 'overview' ? '概览模式：显示核心指标摘要。' : g.tab === 'detail' ? '详情模式：展示完整参数列表。' : '对比模式：并排比较多个方案。'"
      }
    }
  }
}
```

两张卡片共享同一个 namespace，第二个只是一个独立示例。实际的项目中你可以组合使用 tabs + select + 多个 card 来构建复杂的控制面板。
