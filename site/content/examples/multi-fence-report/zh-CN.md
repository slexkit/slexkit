---
title: "多 fence 联动报告"
category: "高级示例"
status: published
order: 24
summary: "多个 fence 共享状态，实现长篇报告中的跨段落联动"
tags: multi-fence, report, advanced, cross-fence
components: section, card, slider, select, stat, badge, callout, grid, tabs
difficulty: 高级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 多 fence 联动报告

在长篇报告中，参数控制、数据分析、结论建议往往分段呈现。通过多个 slex fence 共享同一个 namespace，可以在报告的不同部分实现状态联动——修改顶部的参数，下方的分析和结论自动更新。

---

## 参数控制面板

```slex
{
  slex: "0.1",
  namespace: "multi_fence_report",
  g: {
    region: "north",
    quarter: "q1",
    metric: "revenue",
    data: {
      north: { q1: 1200000, q2: 1350000, q3: 1420000, q4: 1580000 },
      south: { q1: 980000, q2: 1100000, q3: 1250000, q4: 1400000 },
      east: { q1: 1500000, q2: 1650000, q3: 1800000, q4: 1950000 },
      west: { q1: 850000, q2: 950000, q3: 1100000, q4: 1250000 }
    },
    current: function () {
      return this.data[this.region]?.[this.quarter] || 0;
    },
    growth: function () {
      const d = this.data[this.region];
      if (!d) return 0;
      const prev = this.quarter === 'q1' ? d.q4 : d[this.quarter.replace(/\d/, (Number(this.quarter[1]) - 1))];
      return ((d[this.quarter] - prev) / prev * 100).toFixed(1);
    }
  },
  layout: {
    "section:controls": {
      eyebrow: "高级示例 · 参数控制",
      title: "区域销售报告",
      subtitle: "选择区域、季度和指标，下方分析会自动更新。",
      "grid:params": {
        columns: 1, mdColumns: 3,
        "select:region": {
          label: "销售区域",
          "$value": "g.region",
          options: [
            { label: "北方区", value: "north" },
            { label: "南方区", value: "south" },
            { label: "东方区", value: "east" },
            { label: "西方区", value: "west" }
          ],
          onchange: "g.region = String($event)"
        },
        "select:quarter": {
          label: "统计季度",
          "$value": "g.quarter",
          options: [
            { label: "第一季度", value: "q1" },
            { label: "第二季度", value: "q2" },
            { label: "第三季度", value: "q3" },
            { label: "第四季度", value: "q4" }
          ],
          onchange: "g.quarter = String($event)"
        },
        "select:metric": {
          label: "指标维度",
          "$value": "g.metric",
          options: [
            { label: "收入", value: "revenue" },
            { label: "利润", value: "profit" },
            { label: "订单量", value: "orders" }
          ],
          onchange: "g.metric = String($event)"
        }
      },
      "badge:selection": {
        "$label": "(g.region === 'north' ? '北方区' : g.region === 'south' ? '南方区' : g.region === 'east' ? '东方区' : '西方区') + ' · ' + (g.quarter === 'q1' ? '第一季度' : g.quarter === 'q2' ? '第二季度' : g.quarter === 'q3' ? '第三季度' : '第四季度')",
        tone: "info"
      }
    }
  }
}
```

---

## 数据分析面板

```slex
{
  slex: "0.1",
  namespace: "multi_fence_report",
  layout: {
    "section:analysis": {
      eyebrow: "高级示例 · 数据分析",
      title: "销售数据分析",
      subtitle: "基于上方参数的自动分析。",
      "grid:metrics": {
        columns: 1, mdColumns: 3,
        "stat:current": {
          label: "当前收入",
          "$value": "'¥' + g.current().toLocaleString()"
        },
        "stat:growth": {
          label: "环比增长",
          "$value": "g.growth() + '%'",
          "$tone": "Number(g.growth()) > 0 ? 'success' : Number(g.growth()) < 0 ? 'danger' : 'info'"
        },
        "stat:rank": {
          label: "区域排名",
          "$value": "g.region === 'east' ? '第 1 名' : g.region === 'north' ? '第 2 名' : g.region === 'south' ? '第 3 名' : '第 4 名'"
        }
      },
      "callout:insight": {
        tone: "info",
        "$text": "g.region === 'east' ? '东方区表现最佳，建议加大投入。' : g.region === 'north' ? '北方区稳定增长，可考虑扩展。' : g.region === 'south' ? '南方区有增长潜力，需要优化策略。' : '西方区需要重点关注，建议调整资源分配。'"
      }
    }
  }
}
```

---

## 结论与建议

```slex
{
  slex: "0.1",
  namespace: "multi_fence_report",
  layout: {
    "section:conclusion": {
      eyebrow: "高级示例 · 结论",
      title: "销售策略建议",
      subtitle: "基于数据分析的最终建议。",
      "callout:conclusion": {
        "$tone": "Number(g.growth()) > 0 ? 'success' : Number(g.growth()) < 0 ? 'danger' : 'info'",
        "$text": "Number(g.growth()) > 0 ? '当前季度表现良好，建议继续保持。' : Number(g.growth()) < 0 ? '当前季度表现不佳，需要调整策略。' : '当前季度表现平稳，可考虑创新突破。'"
      },
      "grid:actions": {
        columns: 1, mdColumns: 2,
        "stat:priority": {
          label: "优先级",
          "$value": "Number(g.growth()) > 10 ? '高' : Number(g.growth()) > 0 ? '中' : '低'",
          "$tone": "Number(g.growth()) > 10 ? 'success' : Number(g.growth()) > 0 ? 'info' : 'warning'"
        },
        "stat:timeline": {
          label: "建议时间线",
          "$value": "Number(g.growth()) > 10 ? '立即行动' : Number(g.growth()) > 0 ? '本月内' : '下季度'"
        }
      }
    }
  }
}
```

三个 fence 通过共享 namespace `multi_fence_report` 实现状态同步，修改顶部参数后下方数据自动更新。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
