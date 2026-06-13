---
title: 技术白皮书：参数选择 + 分析 + 结论
category: 文档场景
status: published
order: 9
summary: 长篇技术文档中，顶部选参数，中间分析，底部结论，全程联动。
tags: whitepaper, cross-fence, state-sharing, document
components: section, card, slider, select, stat, badge, callout, grid
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 技术白皮书：参数选择 + 分析 + 结论

技术方案书里，开头选行业、规模、预算，中间的技术分析和底部的结论建议自动跟着变——三个 fence 共享同一个 namespace。

## 参数选择面板

```slex
{
  slex: "0.1",
  namespace: "tech_whitepaper",
  g: {
    industry: "ecommerce",
    scale: "medium",
    budget: 50000,
    analysis: function () {
      var scores = {
        ecommerce: { small: 65, medium: 78, large: 92 },
        fintech: { small: 70, medium: 85, large: 95 },
        healthcare: { small: 60, medium: 75, large: 88 }
      };
      return scores[this.industry]?.[this.scale] || 0;
    },
    recommendation: function () {
      var score = this.analysis();
      if (score >= 90) return "强烈推荐";
      if (score >= 80) return "推荐";
      if (score >= 70) return "可以考虑";
      return "暂不推荐";
    }
  },
  layout: {
    "section:params": {
      eyebrow: "技术白皮书 · 参数配置",
      title: "项目评估参数",
      subtitle: "选择行业、规模和预算，下方分析会自动更新。",
      "grid:controls": {
        columns: 1, mdColumns: 3,
        "select:industry": {
          label: "行业领域",
          "$value": "g.industry",
          options: [
            { label: "电商", value: "ecommerce" },
            { label: "金融科技", value: "fintech" },
            { label: "医疗健康", value: "healthcare" }
          ],
          onchange: "g.industry = String($event)"
        },
        "select:scale": {
          label: "项目规模",
          "$value": "g.scale",
          options: [
            { label: "小型", value: "small" },
            { label: "中型", value: "medium" },
            { label: "大型", value: "large" }
          ],
          onchange: "g.scale = String($event)"
        },
        "slider:budget": {
          label: "预算范围",
          "$value": "g.budget",
          min: 10000,
          max: 200000,
          step: 10000,
          unit: "元",
          onchange: "g.budget = Number($event)"
        }
      },
      "badge:selection": {
        "$label": "(g.industry === 'ecommerce' ? '电商' : g.industry === 'fintech' ? '金融科技' : '医疗健康') + ' · ' + (g.scale === 'small' ? '小型' : g.scale === 'medium' ? '中型' : '大型') + ' · ¥' + g.budget.toLocaleString()",
        tone: "info"
      }
    }
  }
}
```

---

## 技术分析

```slex
{
  slex: "0.1",
  namespace: "tech_whitepaper",
  layout: {
    "section:analysis": {
      eyebrow: "技术白皮书 · 分析结果",
      title: "技术可行性分析",
      subtitle: "基于上方参数的自动分析结果。",
      "grid:metrics": {
        columns: 1, mdColumns: 3,
        "stat:score": { label: "综合评分", "$value": "g.analysis()", "$tone": "g.analysis() >= 90 ? 'success' : g.analysis() >= 80 ? 'info' : g.analysis() >= 70 ? 'warning' : 'danger'" },
        "stat:recommendation": { label: "推荐程度", "$value": "g.recommendation()", "$tone": "g.analysis() >= 80 ? 'success' : 'warning'" },
        "stat:budget": { label: "预算评估", "$value": "g.budget >= 100000 ? '充足' : g.budget >= 50000 ? '适中' : '紧张'", "$tone": "g.budget >= 100000 ? 'success' : g.budget >= 50000 ? 'info' : 'warning'" }
      },
      "callout:analysis": {
        "$tone": "g.analysis() >= 90 ? 'success' : g.analysis() >= 80 ? 'info' : 'warning'",
        "$text": "g.analysis() >= 90 ? '技术可行性高，建议立即启动。' : g.analysis() >= 80 ? '技术可行性良好，建议进一步评估。' : '技术可行性一般，需要更多评估。'"
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
  namespace: "tech_whitepaper",
  layout: {
    "section:conclusion": {
      eyebrow: "技术白皮书 · 结论",
      title: "项目建议",
      subtitle: "基于参数选择和分析结果的最终建议。",
      "callout:conclusion": {
        "$tone": "g.analysis() >= 90 ? 'success' : g.analysis() >= 80 ? 'info' : 'warning'",
        "$text": "g.analysis() >= 90 ? '强烈建议启动。技术成熟度高，预算充足。' : g.analysis() >= 80 ? '建议启动。技术可行性良好，需评估市场风险。' : '建议谨慎评估。需要更多市场调研。'"
      },
      "grid:nextSteps": {
        columns: 1, mdColumns: 2,
        "stat:timeline": { label: "建议时间线", "$value": "g.analysis() >= 90 ? '3-6 个月' : g.analysis() >= 80 ? '6-9 个月' : '9-12 个月'" },
        "stat:risk": { label: "风险等级", "$value": "g.analysis() >= 90 ? '低' : g.analysis() >= 80 ? '中' : '高'", "$tone": "g.analysis() >= 90 ? 'success' : g.analysis() >= 80 ? 'warning' : 'danger'" }
      }
    }
  }
}
```

Fallback：金融科技 · 中型 · ¥50,000 → 综合评分 85，推荐启动。

## 跨 fence 联动场景

| 场景 | 结构 | 联动方式 |
|------|------|----------|
| 技术白皮书 | 参数 → 分析 → 结论 | namespace 共享 |
| 项目评估报告 | 输入 → 计算 → 建议 | namespace 共享 |
| 数据仪表板 | 控制 → 图表 → 摘要 | namespace 共享 |
