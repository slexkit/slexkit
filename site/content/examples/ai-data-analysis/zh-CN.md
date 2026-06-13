---
title: "AI 数据分析报告"
category: "聊天消息场景"
status: published
order: 8
summary: "AI 分析数据后生成交互式报告，用户可调整参数重新计算，展示 AI 输出增强的核心价值。"
tags: ai, data, analysis, interactive
components: card, slider, stat, callout, badge, section, grid, tabs
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 数据分析报告

这是一个典型的 AI 数据分析场景：**AI 分析数据后生成交互式报告，用户可调整参数重新计算**。

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
      subtitle: "AI 分析完成，以下是关键指标。调整时间范围和指标维度查看详细数据。",
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
        "$text": "g.metric === 'revenue' ? 'AI 洞察：收入增长稳定，建议继续优化产品定价策略。' : g.metric === 'users' ? 'AI 洞察：用户增长符合预期，可考虑扩大推广渠道。' : 'AI 洞察：转化率持续提升，建议优化用户引导流程。'"
      }
    }
  }
}
```

**关键点：**
- AI 分析完成后生成交互式报告
- 用户可调整时间范围和指标维度
- 数据实时联动，AI 洞察动态更新
- 展示"AI 输出增强"的核心价值

---

### Fallback 文本

如果不支持 SlexKit，上面的代码块会显示为普通代码块，用户可以看到原始的 DSL 定义。这就是"Markdown 原生"的意义——降级优雅，不影响阅读。
