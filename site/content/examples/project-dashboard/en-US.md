---
title: "Project Dashboard"
category: "Dashboard"
status: published
order: 11
summary: "Build an information dashboard with section + grid — covering Sprint progress, quality metrics, and team health with multi-card coordination."
tags: dashboard, sprint, metrics, team
components: section, card, stat, progress, badge, table, select, slider, callout, grid, column
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Project Dashboard

`section` handles grouping, `grid` handles the multi-column layout, and separate cards cover sprint progress, quality metrics, and team health.

```slex
{
  slex: "0.1",
  namespace: "example_dashboard",
  g: {
    sprint: 8, team: 6, sprintProgress: 72, bugs: 12, resolved: 9,
    scope: "on-track",
    bugRate: function () { return this.resolved / this.bugs * 100; },
    teamLoad: function () { return Math.min(100, this.sprint / this.team * 20); },
    scopeStatus: function () { return this.scope === "on-track" ? "On Track" : this.scope === "at-risk" ? "At Risk" : "Off Track"; }
  },
  layout: {
    "section:dashboard": {
      eyebrow: "Sprint Overview",
      title: "Project Dashboard · Sprint 24",
      subtitle: "Data as of today 10:00 AM. Drag sliders to see how different data affects the view.",
      "grid:row1": {
        columns: 1, mdColumns: 3,
        "card:sprint": {
          title: "Sprint Progress",
          "progress:sp": { label: "Completion", "$value": "g.sprintProgress" },
          "stat:scope": { label: "Scope Status", "$value": "g.scopeStatus()" },
          "badge:flag": { "$label": "g.scope === 'on-track' ? 'On Track' : g.scope === 'at-risk' ? '⚠ Warning' : '🚨 Off Track'", "$tone": "g.scope === 'on-track' ? 'success' : g.scope === 'at-risk' ? 'warning' : 'danger'" }
        },
        "card:quality": {
          title: "Quality Metrics",
          "stat:bugs": { label: "Open bugs", value: "3", unit: "" },
          "progress:bugFix": { label: "Fix rate", "$value": "g.bugRate()" },
          "badge:trend": { label: "Trend: Improving", tone: "success" }
        },
        "card:team": {
          title: "Team Health",
          "stat:members": { label: "Team members", value: "6", unit: "" },
          "progress:load": { label: "Load index", "$value": "g.teamLoad()" },
          "callout:note": { "$tone": "g.teamLoad() > 80 ? 'warning' : 'info'", "$text": "g.teamLoad() > 80 ? 'Load is high — consider redistributing tasks.' : 'Team load is within a healthy range.'" }
        }
      },
      "card:detail": {
        title: "Detailed Data",
        "table:tasks": {
          columns: ["Task", "Owner", "Status", "Duration"],
          rows: [["API Refactor", "Alice", "Done", "3d"], ["Frontend Components", "Bob", "In Progress", "2d"], ["Integration Tests", "Carol", "Code Review", "1.5d"], ["Performance Tuning", "Dave", "Pending", "—"]]
        },
        "callout:help": { "$tone": "g.bugRate() < 80 ? 'warning' : 'success'", "$text": "g.bugRate() < 80 ? 'Bug fix rate is below 80% — prioritize high-severity bugs.' : 'Bug fix rate looks good — project quality is under control.'" }
      }
    }
  }
}
```

**Dashboard design principles:**

- Use `section` for top-level grouping (with eyebrow and subtitle for semantic clarity)
- Use `grid` for multi-column layout, each cell holding a `card`
- Each card contains different focus dimensions: stat / progress / badge
- A detail card at the bottom shows table data (task list)
- Use `$text` and `$tone` in callouts for conditional alerts


Similar layouts fit tech lead weekly reports, release QA dashboards, team OKR tracking, and SRE service dashboards.
