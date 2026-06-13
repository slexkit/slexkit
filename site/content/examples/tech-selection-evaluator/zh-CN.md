---
title: 技术选型评估
category: 真实场景
status: published
order: 16
summary: 评估不同技术方案的优劣，通过跨 fence 联动实现参数选择、评分分析和结论推荐。
tags: tech, selection, evaluation, decision
components: card, select, slider, stat, table, callout, badge, grid
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 技术选型评估

技术选型时，需要从多个维度评估不同方案：性能、生态、学习曲线、维护成本。这个示例用跨 fence 联动，开头选技术栈，中间打分，结尾自动算出综合评分和推荐。

## 选择技术栈

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
        "$label": "'当前选择：' + g.techLabel()",
        tone: "info"
      }
    }
  }
}
```

## 评分维度

```slex
{
  slex: "0.1",
  namespace: "example_tech_selection",
  layout: {
    "card:scoring": {
      title: "评分维度（拖动调整）",
      "grid:sliders": {
        columns: 1, mdColumns: 2,
        "column:left": {
          "slider:performance": { label: "性能", "$value": "g.performance", min: 0, max: 100, step: 5, onchange: "g.performance = Number($event)" },
          "slider:ecosystem": { label: "生态系统", "$value": "g.ecosystem", min: 0, max: 100, step: 5, onchange: "g.ecosystem = Number($event)" }
        },
        "column:right": {
          "slider:learning": { label: "学习曲线", "$value": "g.learning", min: 0, max: 100, step: 5, onchange: "g.learning = Number($event)" },
          "slider:maintenance": { label: "维护成本", "$value": "g.maintenance", min: 0, max: 100, step: 5, onchange: "g.maintenance = Number($event)" }
        }
      },
      "table:weights": {
        columns: ["维度", "权重", "得分", "加权分"],
        rows: [
          ["性能", "30%", "g.performance", "g.performance * 0.3"],
          ["生态系统", "25%", "g.ecosystem", "g.ecosystem * 0.25"],
          ["学习曲线", "20%", "g.learning", "g.learning * 0.2"],
          ["维护成本", "25%", "g.maintenance", "g.maintenance * 0.25"]
        ]
      }
    }
  }
}
```

## 综合评估

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
        "$text": "parseFloat(g.totalScore()) >= 85 ? g.techLabel() + ' 综合评分优秀，强烈推荐采用。' : parseFloat(g.totalScore()) >= 75 ? g.techLabel() + ' 综合评分良好，推荐采用。' : g.techLabel() + ' 综合评分一般，建议谨慎评估。'"
      }
    }
  }
}
```

## 技术栈对比参考

| 技术栈 | 性能 | 生态 | 学习曲线 | 维护成本 | 综合评分 |
|--------|------|------|----------|----------|----------|
| React | 85 | 95 | 70 | 80 | 82.5 |
| Vue | 80 | 85 | 85 | 85 | 83.75 |
| Svelte | 95 | 70 | 90 | 90 | 85.5 |
| Angular | 80 | 80 | 60 | 75 | 73.75 |

**工程笔记**：

- 性能权重 30%：运行时性能、包大小、渲染效率
- 生态权重 25%：社区活跃度、第三方库、工具链
- 学习曲线权重 20%：上手难度、文档质量、培训成本
- 维护成本权重 25%：长期维护、升级难度、团队熟悉度
