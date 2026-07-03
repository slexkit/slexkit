---
title: Tech Stack Evaluation
category: Decision Support
status: published
order: 13
summary: Evaluate different tech stacks — cross-fence coordination enables parameter selection, scoring analysis, and recommendation.
tags: tech, selection, evaluation, decision
components: card, select, slider, stat, table, callout, badge, grid
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Tech Stack Evaluation

The evaluator breaks frontend framework selection into four adjustable dimensions: performance, ecosystem, learning curve, and maintenance cost. Select a stack, and the scores and recommendation update below.

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
    recommendation: function () { var s = parseFloat(this.totalScore()); return s >= 85 ? "Highly Recommended" : s >= 75 ? "Recommended" : s >= 60 ? "Consider" : "Not Recommended"; },
    riskLevel: function () { var s = parseFloat(this.totalScore()); return s >= 85 ? "Low" : s >= 75 ? "Medium" : "High"; },
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
      eyebrow: "Decision Support",
      title: "Tech Stack Evaluation",
      subtitle: "Select a tech stack — the scores and recommendations update automatically.",
      "card:select": {
        title: "Select Tech Stack",
      "select:tech": {
        label: "Tech stack",
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
        "$label": "'Current: ' + g.techLabel()",
        tone: "info"
      }
      }
    }
  }
}
```

Drag a slider to adjust the selected stack. The recommendation and risk level update in real time because three independent blocks share the same state.

```slex
{
  slex: "0.1",
  namespace: "example_tech_selection",
  layout: {
    "card:scoring": {
      title: "Score Adjustment",
      "grid:sliders": {
        columns: 1, mdColumns: 2,
        "column:left": {
          "slider:performance": { label: "Performance (30%)", "$value": "g.performance", min: 0, max: 100, step: 5, onchange: "g.performance = Number($event)" },
          "slider:ecosystem": { label: "Ecosystem (25%)", "$value": "g.ecosystem", min: 0, max: 100, step: 5, onchange: "g.ecosystem = Number($event)" }
        },
        "column:right": {
          "slider:learning": { label: "Learning Curve (20%)", "$value": "g.learning", min: 0, max: 100, step: 5, onchange: "g.learning = Number($event)" },
          "slider:maintenance": { label: "Maintenance (25%)", "$value": "g.maintenance", min: 0, max: 100, step: 5, onchange: "g.maintenance = Number($event)" }
        }
      },
      "grid:weights": {
        columns: 1, mdColumns: 4,
        "stat:perf": { label: "Performance (30%)", "$value": "g.performance", unit: "pts" },
        "stat:eco": { label: "Ecosystem (25%)", "$value": "g.ecosystem", unit: "pts" },
        "stat:learn": { label: "Learning (20%)", "$value": "g.learning", unit: "pts" },
        "stat:maint": { label: "Maintenance (25%)", "$value": "g.maintenance", unit: "pts" }
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
      title: "Overall Evaluation",
      "grid:scores": {
        columns: 1, mdColumns: 3,
        "stat:total": { label: "Overall Score", "$value": "g.totalScore()" },
        "stat:recommendation": { label: "Recommendation", "$value": "g.recommendation()", "$tone": "parseFloat(g.totalScore()) >= 85 ? 'success' : parseFloat(g.totalScore()) >= 75 ? 'info' : 'warning'" },
        "stat:risk": { label: "Risk Level", "$value": "g.riskLevel()", "$tone": "parseFloat(g.totalScore()) >= 85 ? 'success' : parseFloat(g.totalScore()) >= 75 ? 'warning' : 'danger'" }
      },
      "callout:advice": {
        "$tone": "parseFloat(g.totalScore()) >= 85 ? 'success' : parseFloat(g.totalScore()) >= 75 ? 'info' : 'warning'",
        "$text": "parseFloat(g.totalScore()) >= 85 ? g.techLabel() + ' scores excellent overall — highly recommended.' : parseFloat(g.totalScore()) >= 75 ? g.techLabel() + ' scores well overall — recommended.' : g.techLabel() + ' scores average — proceed with caution.'"
      }
    }
  }
}
```


Default score reference:

| Stack | Performance | Ecosystem | Learning | Maintenance | Overall |
|-------|------------|-----------|----------|-------------|---------|
| React | 85 | 95 | 70 | 80 | 82.5 |
| Vue | 80 | 85 | 85 | 85 | 83.75 |
| Svelte | 95 | 70 | 90 | 90 | 85.5 |
| Angular | 80 | 80 | 60 | 75 | 73.75 |

Weight distribution: Performance 30%, Ecosystem 25%, Learning Curve 20%, Maintenance 25%. Adjust based on your team's actual situation.
