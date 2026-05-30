---
title: 每日营养需求
category: 科学与教育
status: published
order: 60
summary: 根据体重、身高、年龄、性别和活动量，用 Mifflin-St Jeor 公式计算 BMR、TDEE、蛋白质和饮水建议。
tags: nutrition, health, bmr, tdee
components: card, input, slider, select, formula, stat, callout, grid, column
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 每日营养需求

基础代谢率（BMR）是静息下维持生命活动的最低能量，TDEE 叠加活动系数。两者是一切饮食计划的起点。

男性：$BMR = 10W + 6.25H - 5A + 5$
女性：$BMR = 10W + 6.25H - 5A - 161$

$$TDEE = BMR \times \text{活动系数}$$

```slex
{
  slex: "0.1",
  namespace: "example_nutrition_calculator",
  g: {
    weight: 70, height: 175, age: 30, gender: "male", activity: "moderate",
    bmr: function () { return this.gender === "male" ? 10*this.weight + 6.25*this.height - 5*this.age + 5 : 10*this.weight + 6.25*this.height - 5*this.age - 161; },
    tdee: function () { var m = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 }; return Math.round(this.bmr() * (m[this.activity] || 1.55)); },
    protein: function () { return Math.round(this.weight * (this.activity === "veryActive" ? 2 : this.activity === "active" ? 1.8 : 1.2)); },
    water: function () { return (this.weight * 0.033).toFixed(1); }
  },
  layout: {
    "card:nutrition": {
      title: "每日营养需求",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:weightField": { "input:weight": { label: "体重", "$value": "g.weight", type: "number", unit: "kg", onchange: "g.weight = Number($event || 0)" }, "slider:weight": { label: "体重", "$value": "g.weight", min: 40, max: 150, step: 1, unit: "kg", onchange: "g.weight = Number($event)" } },
        "column:heightField": { "input:height": { label: "身高", "$value": "g.height", type: "number", unit: "cm", onchange: "g.height = Number($event || 0)" }, "slider:height": { label: "身高", "$value": "g.height", min: 140, max: 210, step: 1, unit: "cm", onchange: "g.height = Number($event)" } },
        "column:ageField": { "input:age": { label: "年龄", "$value": "g.age", type: "number", unit: "岁", onchange: "g.age = Number($event || 0)" }, "select:gender": { label: "性别", "$value": "g.gender", options: [{ label: "男", value: "male" }, { label: "女", value: "female" }], onchange: "g.gender = String($event)" } },
        "column:actField": { "select:activity": { label: "活动量", "$value": "g.activity", options: [{ label: "久坐 1.2", value: "sedentary" }, { label: "轻度 1.375", value: "light" }, { label: "中等 1.55", value: "moderate" }, { label: "高 1.725", value: "active" }, { label: "极高 1.9", value: "veryActive" }], onchange: "g.activity = String($event)" } }
      },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:bmr": { label: "BMR", "$value": "Math.round(g.bmr())", unit: "kcal/天" },
        "stat:tdee": { label: "TDEE", "$value": "g.tdee()", unit: "kcal/天" },
        "stat:protein": { label: "蛋白质", "$value": "g.protein()", unit: "g/天" },
        "stat:water": { label: "饮水", "$value": "g.water()", unit: "L/天" }
      },
      "callout:note": { tone: "info", text: "蛋白质按体重 1.2–2.0 g/kg，饮水量 3.3%。运动员和特殊人群需咨询专业人士。" }
    }
  }
}
```

Fallback：男 70kg, 175cm, 30 岁, 中等活动 → BMR 1683, TDEE 2609 kcal/天。

| 活动水平 | 系数 | 描述 |
|---------|------|------|
| 久坐 | 1.2 | 办公室工作，几乎不运动 |
| 轻度 | 1.375 | 每周 1-3 天 |
| 中等 | 1.55 | 每周 3-5 天 |
| 高 | 1.725 | 每周 6-7 天 |
