---
title: 软件项目成本估算器
category: 真实场景
status: published
order: 15
summary: 输入团队规模、开发周期和人员成本，计算项目总成本和人均成本。
tags: project, cost, estimation, management
components: card, input, slider, stat, table, callout, badge, grid, column
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 软件项目成本估算器

老板问你："这个项目要多少钱？"你说："我算算。"然后打开Excel，填一堆公式。其实不用——输入团队配置和周期，成本自动算出来。

```slex
{
  slex: "0.1",
  namespace: "example_project_cost",
  g: {
    frontend: 2, backend: 3, tester: 1, designer: 1,
    months: 6,
    salary: 15000,
    teamSize: function () { return this.frontend + this.backend + this.tester + this.designer; },
    laborCost: function () { return this.teamSize() * this.salary * this.months; },
    equipmentCost: function () { return this.teamSize() * 5000; },
    officeCost: function () { return this.teamSize() * 2000 * this.months; },
    subtotal: function () { return this.laborCost() + this.equipmentCost() + this.officeCost(); },
    riskBuffer: function () { return this.subtotal() * 0.15; },
    totalCost: function () { return this.subtotal() + this.riskBuffer(); },
    perPersonCost: function () { return this.teamSize() > 0 ? this.totalCost() / this.teamSize() : 0; },
    monthlyBurn: function () { return this.months > 0 ? this.totalCost() / this.months : 0; }
  },
  layout: {
    "card:estimator": {
      title: "项目成本估算",
      "grid:team": {
        columns: 1, mdColumns: 4,
        "column:fe": {
          "input:frontend": { label: "前端", "$value": "g.frontend", type: "number", unit: "人", onchange: "g.frontend = Number($event || 0)" }
        },
        "column:be": {
          "input:backend": { label: "后端", "$value": "g.backend", type: "number", unit: "人", onchange: "g.backend = Number($event || 0)" }
        },
        "column:qa": {
          "input:tester": { label: "测试", "$value": "g.tester", type: "number", unit: "人", onchange: "g.tester = Number($event || 0)" }
        },
        "column:ui": {
          "input:designer": { label: "设计", "$value": "g.designer", type: "number", unit: "人", onchange: "g.designer = Number($event || 0)" }
        }
      },
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:period": {
          "input:months": { label: "开发周期", "$value": "g.months", type: "number", unit: "个月", onchange: "g.months = Number($event || 0)" },
          "slider:months": { label: "开发周期", "$value": "g.months", min: 1, max: 24, step: 1, unit: "月", onchange: "g.months = Number($event)" }
        },
        "column:salaryField": {
          "input:salary": { label: "人均月薪", "$value": "g.salary", type: "number", unit: "元", onchange: "g.salary = Number($event || 0)" },
          "slider:salary": { label: "人均月薪", "$value": "g.salary", min: 8000, max: 50000, step: 1000, unit: "元", onchange: "g.salary = Number($event)" }
        }
      },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:team": { label: "团队", "$value": "g.teamSize()", unit: "人" },
        "stat:total": { label: "总成本", "$value": "g.totalCost().toFixed(0)", unit: "元" },
        "stat:perperson": { label: "人均成本", "$value": "g.perPersonCost().toFixed(0)", unit: "元" },
        "stat:monthly": { label: "月均消耗", "$value": "g.monthlyBurn().toFixed(0)", unit: "元" }
      }
    }
  }
}
```

7个人做半年，月均消耗多少？加个测试人员会不会超预算？拖一下就知道。

```slex
{
  slex: "0.1",
  namespace: "example_project_cost",
  layout: {
    "card:breakdown": {
      title: "成本构成",
      "grid:costs": {
        columns: 1, mdColumns: 3,
        "stat:labor": { label: "人力成本", "$value": "g.laborCost().toFixed(0)", unit: "元" },
        "stat:equipment": { label: "设备成本", "$value": "g.equipmentCost().toFixed(0)", unit: "元" },
        "stat:office": { label: "办公成本", "$value": "g.officeCost().toFixed(0)", unit: "元" }
      },
      "grid:extra": {
        columns: 1, mdColumns: 2,
        "stat:risk": { label: "风险缓冲（15%）", "$value": "g.riskBuffer().toFixed(0)", unit: "元" },
        "stat:total": { label: "总计", "$value": "g.totalCost().toFixed(0)", unit: "元" }
      },
      "callout:tip": {
        tone: "info",
        "$text": "g.teamSize() + '人团队，' + g.months + '个月，人均' + g.salary + '元/月，总计' + g.totalCost().toFixed(0) + '元'"
      }
    }
  }
}
```

常见配置参考：

| 团队 | 周期 | 月薪 | 总成本 |
|------|------|------|--------|
| 3人 | 3个月 | 15k | 196,650 |
| 5人 | 6个月 | 15k | 655,500 |
| 8人 | 9个月 | 20k | 1,989,000 |
| 10人 | 12个月 | 25k | 4,140,000 |

风险缓冲15%是经验值，复杂项目可以调到20-25%。设备和办公成本按人头估算，不含服务器和第三方服务。
