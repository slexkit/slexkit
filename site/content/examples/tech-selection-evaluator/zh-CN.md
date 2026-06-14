---
title: 技术选型评估
category: 决策辅助
status: published
order: 13
summary: 评估不同技术方案的优劣，通过跨 fence 联动实现参数选择、评分分析和结论推荐。
tags: tech, selection, evaluation, decision
components: card, select, slider, stat, table, callout, badge, grid
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 技术选型评估

团队要选前端框架，React、Vue、Svelte、Angular，各有各的好。性能、生态、学习曲线、维护成本——怎么量化比较？这里用跨 fence 联动，选一个技术栈，下面的评分和结论自动跟着变。

```slex
{
  slex: "0.1",
  namespace: "example_tech_selection",
  g: {
    tech: "react",
    performance: 85,
    ecosystem: 95,
    learning: 70,
    maintenance: 80,
    techLabel: function () { return { react: "React", vue: "Vue", svelte: "Svelte", angular: "Angular" }[this.tech] || this.tech; },
    totalScore: function () { return (this.performance * 0.3 + this.ecosystem * 0.25 + this.learning * 0.2 + this.maintenance * 0.25).toFixed(1); },
    recommendation: function () { var s = parseFloat(this.totalScore()); return s >= 85 ? "强烈推荐" : s >= 75 ? "推荐" : s >= 60 ? "可以考虑" : "不推荐"; },
    riskLevel: function () { var s = parseFloat(this.totalScore()); return s >= 85 ? "低" : s >= 75 ? "中" : "高"; },
    scores: function () {
      var data = {
        react: { performance: 85, ecosystem: 95, learning: 70, maintenance: 80 },
        vue: { performance: 80, ecosystem: 85, learning: 85, maintenance: 85 },
        svelte: { performance: 95, ecosystem: 70, learning: 90, maintenance: 90 },
        angular: { performance: 80, ecosystem: 80, learning: 60, maintenance: 75 }
      };
      return data[this.tech] || data.react;
    }
  },
  layout: {
    "section:select": {
      eyebrow: "决策辅助",
      title: "技术选型评估",
      subtitle: "选一个技术栈，下面的评分和结论自动跟着变。",
      "card:select": {
        title: "选择技术栈",
      "select:tech": {
        label: "技术栈",
        "$value": "g.tech",
        options: [
          { label: "React", value: "react" },
          { label: "Vue", value: "vue" },
          { label: "Svelte", value: "svelte" },
          { label: "Angular", value: "angular" }
        ],
        onchange: "g.tech = String($event); var s = g.scores(); g.performance = s.performance; g.ecosystem = s.ecosystem; g.learning = s.learning; g.maintenance = s.maintenance;"
      },
      "badge:current": {
        "$label": "'当前：' + g.techLabel() + '（综合 ' + g.totalScore() + ' 分）'",
        tone: "info"
      }
      }
    }
  }
}
```

选了React，觉得性能分太低？拖一下滑块调整，下面的推荐和风险等级实时更新。这就是跨 fence 联动的价值——三个独立的代码块，共享同一份状态。

```slex
{
  slex: "0.1",
  namespace: "example_tech_selection",
  layout: {
    "card:scoring": {
      title: "评分调整",
      "grid:sliders": {
        columns: 1, mdColumns: 2,
        "column:left": {
          "slider:performance": { label: "性能（30%）", "$value": "g.performance", min: 0, max: 100, step: 5, onchange: "g.performance = Number($event)" },
          "slider:ecosystem": { label: "生态系统（25%）", "$value": "g.ecosystem", min: 0, max: 100, step: 5, onchange: "g.ecosystem = Number($event)" }
        },
        "column:right": {
          "slider:learning": { label: "学习曲线（20%）", "$value": "g.learning", min: 0, max: 100, step: 5, onchange: "g.learning = Number($event)" },
          "slider:maintenance": { label: "维护成本（25%）", "$value": "g.maintenance", min: 0, max: 100, step: 5, onchange: "g.maintenance = Number($event)" }
        }
      },
      "grid:weights": {
        columns: 1, mdColumns: 4,
        "stat:perf": { label: "性能（30%）", "$value": "g.performance", unit: "分" },
        "stat:eco": { label: "生态（25%）", "$value": "g.ecosystem", unit: "分" },
        "stat:learn": { label: "学习（20%）", "$value": "g.learning", unit: "分" },
        "stat:maint": { label: "维护（25%）", "$value": "g.maintenance", unit: "分" }
      }
    }
  }
}
```

```slex
{
  slex: "0.1",
  namespace: "example_tech_selection",
  layout: {
    "card:result": {
      title: "综合评估",
      "grid:scores": {
        columns: 1, mdColumns: 3,
        "stat:total": { label: "综合评分", "$value": "g.totalScore()" },
        "stat:recommendation": { label: "推荐程度", "$value": "g.recommendation()", "$tone": "parseFloat(g.totalScore()) >= 85 ? 'success' : parseFloat(g.totalScore()) >= 75 ? 'info' : 'warning'" },
        "stat:risk": { label: "风险等级", "$value": "g.riskLevel()", "$tone": "parseFloat(g.totalScore()) >= 85 ? 'success' : parseFloat(g.totalScore()) >= 75 ? 'warning' : 'danger'" }
      },
      "callout:advice": {
        "$tone": "parseFloat(g.totalScore()) >= 85 ? 'success' : parseFloat(g.totalScore()) >= 75 ? 'info' : 'warning'",
        "$text": "parseFloat(g.totalScore()) >= 85 ? g.techLabel() + ' 综合优秀，强烈推荐。' : parseFloat(g.totalScore()) >= 75 ? g.techLabel() + ' 综合良好，推荐采用。' : g.techLabel() + ' 综合一般，建议谨慎。'"
      }
    }
  }
}
```

Fallback：React 综合评分 82.5，推荐采用。调整评分后结论实时更新。

默认评分参考：

| 技术栈 | 性能 | 生态 | 学习 | 维护 | 综合 |
|--------|------|------|------|------|------|
| React | 85 | 95 | 70 | 80 | 82.5 |
| Vue | 80 | 85 | 85 | 85 | 83.75 |
| Svelte | 95 | 70 | 90 | 90 | 85.5 |
| Angular | 80 | 80 | 60 | 75 | 73.75 |

权重分配：性能30%、生态25%、学习曲线20%、维护成本25%。可以按团队实际情况调整。
