---
title: Social Insurance Calculator
category: Calculator
status: published
order: 5
summary: Enter a salary and city to calculate China's social insurance breakdown — showing personal contributions, employer contributions, and take-home pay.
tags: salary, insurance, calculator, hr
components: card, input, slider, select, stat, callout, grid
difficulty: Beginner
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Social Insurance Calculator

You got an offer — 20,000 RMB/month. How much do you actually take home? HR says social insurance takes a big chunk, but the exact amount varies by city.

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
    cityLabel: function () { return { beijing: "Beijing", shanghai: "Shanghai", guangzhou: "Guangzhou", shenzhen: "Shenzhen" }[this.city] || this.city; }
  },
  layout: {
    "section:salary": {
      eyebrow: "Calculator",
      title: "Social Insurance Calculator",
      subtitle: "Enter pre-tax salary and city to calculate social insurance breakdown in real time.",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:baseField": {
          "input:base": { label: "Pre-tax salary", "$value": "g.base", type: "number", unit: "RMB/mo", onchange: "g.base = Number($event || 0)" },
          "slider:base": { label: "Pre-tax salary", "$value": "g.base", min: 3000, max: 50000, step: 500, unit: "RMB", onchange: "g.base = Number($event)" }
        },
        "column:cityField": {
          "select:city": {
            label: "City",
            "$value": "g.city",
            options: [
              { label: "Beijing", value: "beijing" },
              { label: "Shanghai", value: "shanghai" },
              { label: "Guangzhou", value: "guangzhou" },
              { label: "Shenzhen", value: "shenzhen" }
            ],
            onchange: "g.city = String($event)"
          }
        }
      },
      "grid:summary": {
        columns: 1, mdColumns: 3,
        "stat:personal": { label: "Personal deduction", "$value": "g.personalTotal().toFixed(0)", unit: "RMB" },
        "stat:company": { label: "Employer contribution", "$value": "g.companyTotal().toFixed(0)", unit: "RMB" },
        "stat:takehome": { label: "Take-home pay", "$value": "g.takeHome().toFixed(0)", unit: "RMB" }
      }
    }
  }
}
```

Try switching cities — the housing fund ratio varies a lot (12% in Beijing vs 7% in Shanghai), which can make hundreds of RMB difference in take-home pay.

```slex
{
  slex: "0.1",
  namespace: "example_salary_calculator",
  layout: {
    "card:detail": {
      title: "Detailed Breakdown",
      "grid:personal": {
        columns: 1, mdColumns: 4,
        "stat:pension_p": { label: "Pension (8%)", "$value": "(g.base * 0.08).toFixed(0)", unit: "RMB" },
        "stat:medical_p": { label: "Medical (2%)", "$value": "(g.base * 0.02).toFixed(0)", unit: "RMB" },
        "stat:unemployment_p": { label: "Unemployment (0.5%)", "$value": "(g.base * 0.005).toFixed(0)", unit: "RMB" },
        "stat:housing_p": { label: "Housing fund", "$value": "(g.base * g.currentRate().housing / 100).toFixed(0)", unit: "RMB" }
      },
      "grid:company": {
        columns: 1, mdColumns: 4,
        "stat:pension_c": { label: "Pension (16%)", "$value": "(g.base * 0.16).toFixed(0)", unit: "RMB" },
        "stat:medical_c": { label: "Medical (8%)", "$value": "(g.base * 0.08).toFixed(0)", unit: "RMB" },
        "stat:unemployment_c": { label: "Unemployment (0.5%)", "$value": "(g.base * 0.005).toFixed(0)", unit: "RMB" },
        "stat:other_c": { label: "Injury + Maternity", "$value": "(g.base * 0.01).toFixed(0)", unit: "RMB" }
      },
      "callout:note": {
        "$tone": "g.personalTotal() > 3000 ? 'warning' : 'info'",
        "$text": "g.personalTotal() > 3000 ? 'Personal deduction exceeds 3000 RMB — take-home pay may be lower than expected.' : 'Higher housing fund ratio means less take-home pay, but the fund is withdrawable.'"
      }
    }
  }
}
```

| City | Pension | Medical | Unemployment | Housing Fund | Personal Total |
|------|---------|---------|-------------|-------------|----------------|
| Beijing | 8% | 2% | 0.5% | 12% | 22.5% |
| Shanghai | 8% | 2% | 0.5% | 7% | 17.5% |
| Guangzhou | 8% | 2% | 0.5% | 5% | 15.5% |
| Shenzhen | 8% | 2% | 0.5% | 5% | 15.5% |
