---
title: 五险一金计算器
category: 计算器
status: published
order: 5
summary: 输入工资基数和城市，计算五险一金明细，显示个人缴纳、单位缴纳和总计。
tags: salary, insurance, calculator, hr
components: card, input, slider, select, stat, callout, badge, grid
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
      beijing: { pensionP: 8, medicalP: 2, unemploymentP: 0.5, pensionC: 16, medicalC: 8, unemploymentC: 0.5, injury: 0.2, maternity: 0.8, housing: 12 },
      shanghai: { pensionP: 8, medicalP: 2, unemploymentP: 0.5, pensionC: 16, medicalC: 8, unemploymentC: 0.5, injury: 0.2, maternity: 0.8, housing: 7 },
      guangzhou: { pensionP: 8, medicalP: 2, unemploymentP: 0.5, pensionC: 16, medicalC: 8, unemploymentC: 0.5, injury: 0.2, maternity: 0.8, housing: 5 },
      shenzhen: { pensionP: 8, medicalP: 2, unemploymentP: 0.5, pensionC: 16, medicalC: 8, unemploymentC: 0.5, injury: 0.2, maternity: 0.8, housing: 5 }
    },
    currentRate: function () { return this.rates[this.city] || this.rates.beijing; },
    personalRate: function () { var r = this.currentRate(); return r.pensionP + r.medicalP + r.unemploymentP + r.housing; },
    companyRate: function () { var r = this.currentRate(); return r.pensionC + r.medicalC + r.unemploymentC + r.injury + r.maternity + r.housing; },
    personalTotal: function () { return this.base * this.personalRate() / 100; },
    companyTotal: function () { return this.base * this.companyRate() / 100; },
    total: function () { return this.personalTotal() + this.companyTotal(); },
    takeHome: function () { return this.base - this.personalTotal(); },
    cityLabel: function () { return { beijing: "北京", shanghai: "上海", guangzhou: "广州", shenzhen: "深圳" }[this.city] || this.city; }
  },
  layout: {
    "section:salary": {
      eyebrow: "计算器",
      title: "五险一金计算器",
      subtitle: "输入税前工资和城市，实时计算五险一金明细。",
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
        "$tone": "g.personalTotal() > 3000 ? 'warning' : 'info'",
        "$text": "g.personalTotal() > 3000 ? '个人扣除超过3000元，到手工资可能低于预期。' : '公积金比例越高，到手工资越少，但公积金可以提取使用。'"
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

Fallback：北京月薪 20000 元 → 个人扣除 5963 元，公司缴纳 9938 元，到手 14038 元。
