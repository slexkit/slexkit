---
title: "AI 数据分析报告"
category: "聊天消息场景"
status: published
order: 8
summary: "AI 分析数据后生成交互式报告，用户可调整参数重新计算"
tags: ai, data, analysis, interactive
components: card, slider, stat, callout, badge, section, grid, tabs
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 数据分析报告

数据分析场景中，AI 生成的报告往往需要用户交互——调整时间范围、切换指标维度、对比不同数据。下面的示例展示了一个可交互的数据分析面板，用户调整参数后数据会实时联动。

---

## 数据概览

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
      const d = this.data[this.metric];
      return d ? d[this.timeRange - 1] : 0;
    },
    growth: function () {
      const d = this.data[this.metric];
      if (!d || this.timeRange < 2) return 0;
      return ((d[this.timeRange - 1] - d[this.timeRange - 2]) / d[this.timeRange - 2] * 100).toFixed(1);
    }
  },
  layout: {
    "section:overview": {
      eyebrow: "AI 数据分析",
      title: "业务指标监控面板",
      subtitle: "调整时间范围和指标维度查看详细数据。",
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
      "grid:stats": {
        columns: 1, mdColumns: 3,
        "stat:current": {
          "$label": "g.metric === 'revenue' ? '当前收入' : g.metric === 'users' ? '当前用户' : '当前转化率'",
          "$value": "g.metric === 'revenue' ? '¥' + g.currentValue().toLocaleString() : g.metric === 'users' ? g.currentValue().toLocaleString() : g.currentValue() + '%'"
        },
        "stat:growth": {
          label: "环比增长",
          "$value": "g.growth() + '%'",
          "$tone": "Number(g.growth()) > 0 ? 'success' : Number(g.growth()) < 0 ? 'danger' : 'info'"
        },
        "stat:period": {
          label: "分析周期",
          "$value": "g.timeRange + ' 个月'"
        }
      },
      "callout:aiInsight": {
        tone: "info",
        "$text": "g.metric === 'revenue' ? '收入增长稳定，建议继续优化产品定价策略。' : g.metric === 'users' ? '用户增长符合预期，可考虑扩大推广渠道。' : '转化率持续提升，建议优化用户引导流程。'"
      }
    }
  }
}
```

调整滑块或切换指标后，所有 stat 和 callout 都会自动更新。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
