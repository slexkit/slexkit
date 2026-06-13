---
title: AI 数据分析报告
category: 聊天消息场景
status: published
order: 8
summary: AI 分析数据后生成交互式报告，用户调整参数后数据实时联动。
tags: ai, data, analysis, interactive
components: section, grid, select, slider, stat, callout, badge
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 数据分析报告

AI 分析完数据后，不是给你一张静态图，而是一个可操作的面板——拖滑块改时间范围、选指标维度，数字和趋势实时联动。

```slex
{
  slex: "0.1",
  namespace: "ai_data_analysis",
  g: {
    timeRange: 6,
    metric: "revenue",
    data: {
      revenue: [120000, 135000, 142000, 158000, 165000, 172000, 180000, 195000, 210000, 225000, 240000, 255000],
      users: [8000, 8500, 9200, 9800, 10500, 11200, 12000, 12800, 13500, 14200, 15000, 15800],
      conversion: [2.1, 2.3, 2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.7, 3.9, 4.1, 4.3]
    },
    currentValue: function () {
      var d = this.data[this.metric];
      return d ? d[this.timeRange - 1] : 0;
    },
    growth: function () {
      var d = this.data[this.metric];
      if (!d || this.timeRange < 2) return 0;
      return ((d[this.timeRange - 1] - d[this.timeRange - 2]) / d[this.timeRange - 2] * 100).toFixed(1);
    },
    metricLabel: function () { return { revenue: "当前收入", users: "当前用户", conversion: "当前转化率" }[this.metric] || ""; },
    formatValue: function (v) {
      if (this.metric === "revenue") return "¥" + v.toLocaleString();
      if (this.metric === "users") return v.toLocaleString() + "人";
      return v + "%";
    }
  },
  layout: {
    "section:overview": {
      eyebrow: "AI 数据分析",
      title: "业务指标监控面板",
      subtitle: "AI 分析完成，调整参数查看详细数据。",
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
        "slider:timeRange": {
          label: "时间范围",
          "$value": "g.timeRange",
          min: 1,
          max: 12,
          step: 1,
          unit: "月",
          onchange: "g.timeRange = Number($event)"
        }
      },
      "stat:current": {
        "$label": "g.metricLabel()",
        "$value": "g.formatValue(g.currentValue())"
      },
      "stat:growth": {
        label: "环比增长",
        "$value": "g.growth() + '%'",
        "$tone": "Number(g.growth()) > 0 ? 'success' : Number(g.growth()) < 0 ? 'danger' : 'info'"
      },
      "badge:period": {
        "$label": "g.timeRange + ' 个月'",
        tone: "info"
      },
      "callout:aiInsight": {
        "$tone": "Number(g.growth()) > 5 ? 'success' : Number(g.growth()) > 0 ? 'info' : 'warning'",
        "$text": "Number(g.growth()) > 5 ? 'AI 洞察：增长强劲，建议继续优化。' : Number(g.growth()) > 0 ? 'AI 洞察：平稳增长，可考虑扩大投入。' : 'AI 洞察：增长放缓，需关注。'"
      }
    }
  }
}
```

Fallback：收入 ¥255,000（第 12 个月），环比 +6.3%。
