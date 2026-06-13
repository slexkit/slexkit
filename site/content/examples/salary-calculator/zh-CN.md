---
title: 五险一金计算器
category: 真实场景
status: published
order: 14
summary: 输入工资基数和城市，计算五险一金明细，显示个人缴纳、单位缴纳和总计。
tags: salary, insurance, calculator, hr
components: card, input, slider, select, stat, table, callout, badge, grid
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 五险一金计算器

你面试拿到一个offer，月薪2万，到手能拿多少？HR说五险一金要扣一大笔，但具体扣多少、怎么算，每个城市还不一样。

```slex
{
  slex: "0.1",
  namespace: "example_salary_calculator",
  g: {
    base: 20000,
    city: "beijing",
    rates: {
      beijing: { pension: 8, medical: 2, unemployment: 0.5, injury: 0, maternity: 0, housing: 12 },
      shanghai: { pension: 8, medical: 2, unemployment: 0.5, injury: 0, maternity: 0, housing: 7 },
      guangzhou: { pension: 8, medical: 2, unemployment: 0.5, injury: 0, maternity: 0, housing: 5 },
      shenzhen: { pension: 8, medical: 2, unemployment: 0.5, injury: 0, maternity: 0, housing: 5 }
    },
    currentRate: function () { return this.rates[this.city] || this.rates.beijing; },
    personalRate: function () { var r = this.currentRate(); return r.pension + r.medical + r.unemployment + r.housing; },
    companyRate: function () { var r = this.currentRate(); return r.pension + r.medical + r.unemployment + r.injury + r.maternity + r.housing; },
    personalTotal: function () { return this.base * this.personalRate() / 100; },
    companyTotal: function () { return this.base * this.companyRate() / 100; },
    total: function () { return this.personalTotal() + this.companyTotal(); },
    takeHome: function () { return this.base - this.personalTotal(); },
    cityLabel: function () { return { beijing: "北京", shanghai: "上海", guangzhou: "广州", shenzhen: "深圳" }[this.city] || this.city; }
  },
  layout: {
    "card:salary": {
      title: "五险一金计算器",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:baseField": {
          "input:base": { label: "税前工资", "$value": "g.base", type: "number", unit: "元/月", onchange: "g.base = Number($event || 0)" },
          "slider:base": { label: "税前工资", "$value": "g.base", min: 3000, max: 50000, step: 500, unit: "元", onchange: "g.base = Number($event)" }
        },
        "column:cityField": {
          "select:city": {
            label: "缴纳城市",
            "$value": "g.city",
            options: [
              { label: "北京", value: "beijing" },
              { label: "上海", value: "shanghai" },
              { label: "广州", value: "guangzhou" },
              { label: "深圳", value: "shenzhen" }
            ],
            onchange: "g.city = String($event)"
          }
        }
      },
      "grid:summary": {
        columns: 1, mdColumns: 3,
        "stat:personal": { label: "个人扣除", "$value": "g.personalTotal().toFixed(0)", unit: "元" },
        "stat:company": { label: "公司缴纳", "$value": "g.companyTotal().toFixed(0)", unit: "元" },
        "stat:takehome": { label: "到手工资", "$value": "g.takeHome().toFixed(0)", unit: "元" }
      }
    }
  }
}
```

换个城市看看，公积金比例差很多——北京12%，上海7%，到手工资能差好几百。

```slex
{
  slex: "0.1",
  namespace: "example_salary_calculator",
  layout: {
    "card:detail": {
      title: "各项明细",
      "grid:personal": {
        columns: 1, mdColumns: 4,
        "stat:pension_p": { label: "养老（8%）", "$value": "(g.base * 0.08).toFixed(0)", unit: "元" },
        "stat:medical_p": { label: "医疗（2%）", "$value": "(g.base * 0.02).toFixed(0)", unit: "元" },
        "stat:unemployment_p": { label: "失业（0.5%）", "$value": "(g.base * 0.005).toFixed(0)", unit: "元" },
        "stat:housing_p": { label: "公积金", "$value": "(g.base * g.currentRate().housing / 100).toFixed(0)", unit: "元" }
      },
      "grid:company": {
        columns: 1, mdColumns: 4,
        "stat:pension_c": { label: "养老（16%）", "$value": "(g.base * 0.16).toFixed(0)", unit: "元" },
        "stat:medical_c": { label: "医疗（8%）", "$value": "(g.base * 0.08).toFixed(0)", unit: "元" },
        "stat:unemployment_c": { label: "失业（0.5%）", "$value": "(g.base * 0.005).toFixed(0)", unit: "元" },
        "stat:other_c": { label: "工伤+生育", "$value": "(g.base * 0.01).toFixed(0)", unit: "元" }
      },
      "callout:note": {
        tone: "info",
        "$text": "g.cityLabel() + '：个人缴 ' + g.personalRate() + '%（' + g.personalTotal().toFixed(0) + '元），公司缴 ' + g.companyRate() + '%（' + g.companyTotal().toFixed(0) + '元）'"
      }
    }
  }
}
```

| 城市 | 养老 | 医疗 | 失业 | 公积金 | 个人合计 |
|------|------|------|------|--------|----------|
| 北京 | 8% | 2% | 0.5% | 12% | 22.5% |
| 上海 | 8% | 2% | 0.5% | 7% | 17.5% |
| 广州 | 8% | 2% | 0.5% | 5% | 15.5% |
| 深圳 | 8% | 2% | 0.5% | 5% | 15.5% |
