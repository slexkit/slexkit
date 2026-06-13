---
title: 多 fence 联动报告
category: 高级示例
status: published
order: 24
summary: 多个 fence 共享状态，长篇报告中不同段落的数据实时联动。
tags: multi-fence, report, advanced, cross-fence
components: section, card, slider, select, stat, badge, callout, grid, tabs
difficulty: 高级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 多 fence 联动报告

长篇报告里，参数控制、数据分析、结论建议往往分段呈现。用同一个 namespace 跨 fence 共享状态，改顶部参数，下面所有段落自动跟着变。

## 参数控制面板

```slex
{
  slex: "0.1",
  namespace: "multi_fence_report",
  g: {
    region: "north",
    quarter: "q1",
    data: {
      north: { q1: 1200000, q2: 1350000, q3: 1420000, q4: 1580000 },
      south: { q1: 980000, q2: 1100000, q3: 1250000, q4: 1400000 },
      east: { q1: 1500000, q2: 1650000, q3: 1800000, q4: 1950000 },
      west: { q1: 850000, q2: 950000, q3: 1100000, q4: 1250000 }
    },
    current: function () { return this.data[this.region]?.[this.quarter] || 0; },
    prev: function () {
      var d = this.data[this.region];
      if (!d) return 0;
      var keys = ["q1","q2","q3","q4"];
      var idx = keys.indexOf(this.quarter);
      return idx > 0 ? d[keys[idx - 1]] : d.q4;
    },
    growth: function () {
      var p = this.prev();
      return p > 0 ? ((this.current() - p) / p * 100).toFixed(1) : "0.0";
    },
    regionLabel: function () { return { north: "北方区", south: "南方区", east: "东方区", west: "西方区" }[this.region] || this.region; },
    quarterLabel: function () { return { q1: "Q1", q2: "Q2", q3: "Q3", q4: "Q4" }[this.quarter] || this.quarter; }
  },
  layout: {
    "section:controls": {
      eyebrow: "高级示例 · 参数控制",
      title: "区域销售报告",
      subtitle: "选择区域和季度，下方分析自动更新。",
      "grid:params": {
        columns: 1, mdColumns: 2,
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
            { label: "Q1", value: "q1" },
            { label: "Q2", value: "q2" },
            { label: "Q3", value: "q3" },
            { label: "Q4", value: "q4" }
          ],
          onchange: "g.quarter = String($event)"
        }
      }
    }
  }
}
```

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
        "stat:current": { label: "当前收入", "$value": "'¥' + g.current().toLocaleString()" },
        "stat:growth": { label: "环比增长", "$value": "g.growth() + '%'", "$tone": "Number(g.growth()) > 0 ? 'success' : 'danger'" },
        "stat:rank": { label: "区域排名", "$value": "g.region === 'east' ? '第 1 名' : g.region === 'north' ? '第 2 名' : g.region === 'south' ? '第 3 名' : '第 4 名'" }
      },
      "callout:insight": {
        tone: "info",
        "$text": "g.region === 'east' ? '东方区表现最佳，建议加大投入。' : g.region === 'west' ? '西方区需要重点关注，建议调整资源分配。' : '表现平稳，可考虑创新突破。'"
      }
    }
  }
}
```

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
        "$tone": "Number(g.growth()) > 0 ? 'success' : 'danger'",
        "$text": "Number(g.growth()) > 0 ? '当前季度表现良好，建议继续保持。' : '当前季度表现不佳，需要调整策略。'"
      },
      "grid:actions": {
        columns: 1, mdColumns: 2,
        "stat:priority": { label: "优先级", "$value": "Number(g.growth()) > 10 ? '高' : Number(g.growth()) > 0 ? '中' : '低'" },
        "stat:timeline": { label: "建议时间线", "$value": "Number(g.growth()) > 10 ? '立即行动' : Number(g.growth()) > 0 ? '本月内' : '下季度'" }
      }
    }
  }
}
```

Fallback：东方区 Q4 收入 ¥1,950,000，环比 +8.3%。

## 跨 fence 联动机制

```
[控制面板 fence] ──namespace──→ [分析面板 fence]
       │                              │
       └──────namespace───→ [结论面板 fence]
```

三个 fence 共享 `namespace: "multi_fence_report"`，修改区域或季度，三个段落的 stat、badge、callout 同步更新。
