---
title: AI 聊天消息中的交互片段
category: 聊天消息场景
status: published
order: 6
summary: AI 回复中嵌入可交互的数据面板，用户调整参数后实时计算。
tags: ai, chat, message, interactive
components: section, grid, select, slider, stat, callout
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 聊天消息中的交互片段

用户问："帮我分析一下这个月的销售数据"。AI 回复时，除了文字分析，还能嵌入一个可操作的面板——用户拖滑块选月份、选指标，数字实时联动。

```slex
{
  slex: "0.1",
  namespace: "ai_chat_message",
  g: {
    metric: "revenue", period: 1, value: 125000,
    metrics: {
      revenue: { label: "收入", unit: "¥", base: 125000 },
      users: { label: "用户数", unit: "人", base: 8200 },
      conversion: { label: "转化率", unit: "%", base: 3.2 }
    },
    current: function () {
      var m = this.metrics[this.metric];
      var factor = this.period * (1 + Math.sin(this.period) * 0.1);
      if (this.metric === "conversion") return (m.base * factor / this.period).toFixed(1);
      return Math.round(m.base * factor).toLocaleString();
    },
    growth: function () {
      var base = this.metrics[this.metric].base;
      var curr = this.metric === "conversion" ? parseFloat(this.current()) : parseInt(this.current().replace(/,/g, ""));
      return ((curr - base) / base * 100).toFixed(1);
    }
  },
  layout: {
    "section:analysis": {
      eyebrow: "AI 数据分析",
      title: "关键指标监控",
      subtitle: "拖动滑块调整时间范围，查看不同维度的数据。",
      "grid:controls": {
        columns: 1, mdColumns: 2,
        "select:metric": {
          label: "指标维度",
          "$value": "g.metric",
          options: [
            { label: "收入", value: "revenue" },
            { label: "用户数", value: "users" },
            { label: "转化率", value: "conversion" }
          ],
          onchange: "g.metric = String($event)"
        },
        "slider:period": {
          label: "时间范围",
          "$value": "g.period",
          min: 1,
          max: 12,
          step: 1,
          unit: "月",
          onchange: "g.period = Number($event)"
        }
      },
      "stat:current": {
        "$label": "g.metrics[g.metric].label + '（' + g.period + '个月）'",
        "$value": "g.metrics[g.metric].unit === '¥' ? '¥' + g.current() : g.metrics[g.metric].unit === '%' ? g.current() + '%' : g.current() + '人'"
      },
      "stat:growth": {
        label: "环比增长",
        "$value": "g.growth() + '%'",
        "$tone": "Number(g.growth()) > 0 ? 'success' : Number(g.growth()) < 0 ? 'danger' : 'info'"
      },
      "callout:insight": {
        "$tone": "Number(g.growth()) > 5 ? 'success' : Number(g.growth()) > 0 ? 'info' : 'warning'",
        "$text": "Number(g.growth()) > 5 ? '增长强劲，继续保持。' : Number(g.growth()) > 0 ? '平稳增长，可优化策略。' : '增长放缓，需关注。'"
      }
    }
  }
}
```

Fallback：收入 ¥125,000/月，环比 +10.0%。

## AI 回复场景

| 场景 | AI 做什么 | SlexKit 做什么 |
|------|----------|----------------|
| 数据分析 | 给出结论 | 嵌入可调整的分析面板 |
| 产品推荐 | 列出选项 | 嵌入可筛选的产品对比表 |
| 代码审查 | 指出问题 | 嵌入可展开的修复建议 |
| 报告生成 | 生成图表 | 嵌入可交互的图表控件 |
