---
title: "项目仪表盘"
category: "仪表盘"
status: published
order: 11
summary: "用 section + grid 搭建信息仪表盘，覆盖 Sprint 进度、质量指标和团队健康度的多卡片联动。"
tags: dashboard, sprint, metrics, team
components: section, card, stat, progress, badge, table, select, slider, callout, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 项目仪表盘

真实项目需要一览全局——不是单一张计算卡片，而是一个**仪表盘**。用 `section` 做区块分组，`grid` 做多列布局，每个 card 展示一个关注领域。

```slex
{
  slex: "0.1",
  namespace: "example_dashboard",
  g: {
    sprint: 8, team: 6, sprintProgress: 72, bugs: 12, resolved: 9,
    scope: "on-track",
    bugRate: function () { return this.resolved / this.bugs * 100; },
    teamLoad: function () { return Math.min(100, this.sprint / this.team * 20); },
    scopeStatus: function () { return this.scope === "on-track" ? "正常" : this.scope === "at-risk" ? "有风险" : "已偏离"; }
  },
  layout: {
    "section:dashboard": {
      eyebrow: "Sprint 概览",
      title: "项目仪表盘 · Sprint 24",
      subtitle: "数据截止今日 10:00 AM。拖滑动条查看不同假想数据的效果。",
      "grid:row1": {
        columns: 1, mdColumns: 3,
        "card:sprint": {
          title: "Sprint 进度",
          "progress:sp": { label: "完成度", "$value": "g.sprintProgress" },
          "stat:scope": { "$label": "范围状态", "$value": "g.scopeStatus()" },
          "badge:flag": { "$label": "g.scope === 'on-track' ? '正常' : g.scope === 'at-risk' ? '⚠ 预警' : '🚨 偏离'", "$tone": "g.scope === 'on-track' ? 'success' : g.scope === 'at-risk' ? 'warning' : 'danger'" }
        },
        "card:quality": {
          title: "质量指标",
          "stat:bugs": { label: "剩余缺陷", value: "3", unit: "个" },
          "progress:bugFix": { label: "修复率", "$value": "g.bugRate()" },
          "badge:trend": { label: "趋势：改善中", tone: "success" }
        },
        "card:team": {
          title: "团队健康度",
          "stat:members": { label: "团队成员", value: "6", unit: "人" },
          "progress:load": { label: "负载指数", "$value": "g.teamLoad()" },
          "callout:note": { "$tone": "g.teamLoad() > 80 ? 'warning' : 'info'", "$text": "g.teamLoad() > 80 ? '负载偏高，建议调整任务分配。' : '团队负载在健康范围内。'" }
        }
      },
      "card:detail": {
        title: "详细数据",
        "table:tasks": {
          columns: ["任务", "负责人", "状态", "耗时"],
          rows: [["API 重构", "张三", "已完成", "3d"], ["前端组件", "李四", "进行中", "2d"], ["集成测试", "王五", "代码审查", "1.5d"], ["性能优化", "赵六", "待开始", "—"]]
        },
        "callout:help": { "$tone": "g.bugRate() < 80 ? 'warning' : 'success'", "$text": "g.bugRate() < 80 ? '缺陷修复率低于80%，建议优先处理高优先级缺陷。' : '缺陷修复率良好，项目质量可控。'" }
      }
    }
  }
}
```

**仪表盘的设计思路：**

- 用 `section` 做顶层分组（带 eyebrow 和 subtitle，语义清晰）
- 用 `grid` 做多列布局，每个格子放一个 `card`
- 每个 card 内放不同关注维度的 stat / progress / badge
- 底部放一个详情 card，展示表格数据（任务列表）
- 通过 `$text` 和 `$tone` 在 callout 中做条件提示


这个模式适用于：技术 Leader 周报面板、发布质检看板、团队 OKR 追踪、SRE 服务大盘。
