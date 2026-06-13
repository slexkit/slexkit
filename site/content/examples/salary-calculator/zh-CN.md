---
title: 五险一金计算器
category: 真实场景
status: published
order: 14
summary: 输入工资基数和城市，计算五险一金明细，显示个人缴纳、单位缴纳和总计。
tags: salary, insurance, calculator, hr
components: card, input, slider, select, stat, table, callout, formula, badge, grid
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 五险一金计算器

HR 或员工经常需要算五险一金：工资基数多少、各项比例多少、个人和单位各缴多少。这个计算器输入工资基数、选城市，实时算出明细。

## 核心公式

个人缴纳比例：$8\% + 2\% + 0.5\% + 12\% = 22.5\%$

单位缴纳比例：$16\% + 8\% + 0.5\% + 0.2\% + 0.8\% + 12\% = 37.5\%$

## 参数区

```slex
{
  slex: "0.1",
  namespace: "example_salary_calculator",
  g: {
    base: 10000,
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
          "input:base": { label: "工资基数", "$value": "g.base", type: "number", unit: "元", onchange: "g.base = Number($event || 0)" },
          "slider:base": { label: "工资基数", "$value": "g.base", min: 3000, max: 50000, step: 500, unit: "元", onchange: "g.base = Number($event)" }
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
        "stat:personal": { label: "个人缴纳", "$value": "g.personalTotal().toFixed(0)", unit: "元" },
        "stat:company": { label: "单位缴纳", "$value": "g.companyTotal().toFixed(0)", unit: "元" },
        "stat:takehome": { label: "到手工资", "$value": "g.takeHome().toFixed(0)", unit: "元" }
      }
    }
  }
}
```

## 计算明细

```slex
{
  slex: "0.1",
  namespace: "example_salary_calculator",
  layout: {
    "card:detail": {
      title: "缴纳明细",
      "table:breakdown": {
        columns: ["险种", "个人比例", "个人金额", "单位比例", "单位金额"],
        rows: [
          ["养老保险", "8%", "g.base * 0.08", "16%", "g.base * 0.16"],
          ["医疗保险", "2%", "g.base * 0.02", "8%", "g.base * 0.08"],
          ["失业保险", "0.5%", "g.base * 0.005", "0.5%", "g.base * 0.005"],
          ["工伤保险", "0%", "0", "0.2%", "g.base * 0.002"],
          ["生育保险", "0%", "0", "0.8%", "g.base * 0.008"],
          ["公积金", "g.currentRate().housing + '%'", "g.base * g.currentRate().housing / 100", "g.currentRate().housing + '%'", "g.base * g.currentRate().housing / 100"]
        ]
      },
      "callout:note": {
        tone: "info",
        "$text": "'当前城市：' + g.cityLabel() + '，个人缴纳比例 ' + g.personalRate() + '%，单位缴纳比例 ' + g.companyRate() + '%'"
      }
    }
  }
}
```

## 城市比例参考

| 城市 | 养老 | 医疗 | 失业 | 工伤 | 生育 | 公积金 |
|------|------|------|------|------|------|--------|
| 北京 | 8% | 2% | 0.5% | 0% | 0% | 12% |
| 上海 | 8% | 2% | 0.5% | 0% | 0% | 7% |
| 广州 | 8% | 2% | 0.5% | 0% | 0% | 5% |
| 深圳 | 8% | 2% | 0.5% | 0% | 0% | 5% |

**工程笔记**：

- 公积金比例可在 5%-12% 之间，这里取常见值
- 工伤和生育保险由单位全额承担
- 各地比例可能有微调，以当地社保局公布为准
- 到手工资 = 工资基数 - 个人缴纳部分
