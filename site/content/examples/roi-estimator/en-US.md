---
title: Build vs Buy Decision
category: Decision Support
status: published
order: 14
summary: A build-vs-buy decision matrix — four-dimension evaluation across feature coverage, cost, timeline, and risk with automatic recommendation.
tags: build-vs-buy, decision, procurement, cost
components: section, card, select, slider, checkbox, badge, callout, accordion, table, grid, column
difficulty: Beginner
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Build vs Buy Decision

A build-vs-buy decision is split into four dimensions: feature coverage, cost, timeline, and risk. Adjust the scores and the recommendation updates automatically.

```slex
{
  slex: "0.1",
  namespace: "example_build_vs_buy",
  g: {
    scope: "core",
    buildFit: 60, buildTime: 6, buildCost: 80,
    buyFit: 85, buyTime: 1, buyCost: 40, buyVendorLock: 30,
    buildTotal: function () { return (this.buildFit + (100 - this.buildCost) + (100 - this.buildTime * 10)) / 3; },
    buyTotal: function () { return (this.buyFit + (100 - this.buyCost) + (100 - this.buyTime * 10) - this.buyVendorLock * 0.5) / 3; },
    recommendation: function () {
      if (this.scope === "core") return this.buildTotal() >= this.buyTotal() ? "Build" : "Buy (but evaluate long-term cost)";
      return this.buyTotal() >= this.buildTotal() ? "Buy" : "Build (caution: non-core build requires care)";
    },
    diff: function () { return Math.abs(this.buildTotal() - this.buyTotal()); }
  },
  layout: {
    "section:decision": {
      eyebrow: "Tech Decision",
      title: "Build vs Buy Decision",
      subtitle: "Compare two solutions across multiple dimensions. Drag sliders to see how scores change.",
      "select:scope": {
        label: "Feature positioning",
        "$value": "g.scope",
        options: [
          { label: "Core business (key differentiator)", value: "core" },
          { label: "Supporting feature (non-core)", value: "non-core" }
        ],
        onchange: "g.scope = String($event)"
      },
      "table:comparison": {
        columns: ["Dimension", "Build", "Buy"],
        rows: [
          ["Feature fit", "g.buildFit + '%'", "g.buyFit + '%'"],
          ["Time to market", "g.buildTime + ' months'", "g.buyTime + ' months'"],
          ["Cost score", "g.buildCost + '/100'", "g.buyCost + '/100'"],
          ["Vendor lock-in", "—", "g.buyVendorLock + '/100'"]
        ]
      },
      "grid:sliders": {
        columns: 1, mdColumns: 2,
        "column:build": {
          "card:buildSliders": {
            title: "Build Option",
            "slider:buildFit": { label: "Feature fit", "$value": "g.buildFit", min: 0, max: 100, step: 5, onchange: "g.buildFit = Number($event)" },
            "slider:buildTime": { label: "Time to market (months)", "$value": "g.buildTime", min: 1, max: 24, step: 1, unit: "mo", onchange: "g.buildTime = Number($event)" },
            "slider:buildCost": { label: "Cost score", "$value": "g.buildCost", min: 0, max: 100, step: 5, onchange: "g.buildCost = Number($event)" }
          }
        },
        "column:buy": {
          "card:buySliders": {
            title: "Buy Option",
            "slider:buyFit": { label: "Feature fit", "$value": "g.buyFit", min: 0, max: 100, step: 5, onchange: "g.buyFit = Number($event)" },
            "slider:buyTime": { label: "Time to market (months)", "$value": "g.buyTime", min: 1, max: 24, step: 1, unit: "mo", onchange: "g.buyTime = Number($event)" },
            "slider:buyCost": { label: "Cost score", "$value": "g.buyCost", min: 0, max: 100, step: 5, onchange: "g.buyCost = Number($event)" },
            "slider:lock": { label: "Vendor lock-in risk", "$value": "g.buyVendorLock", min: 0, max: 100, step: 5, onchange: "g.buyVendorLock = Number($event)" }
          }
        }
      },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:buildScore": { label: "Build score", "$value": "g.buildTotal().toFixed(1)" },
        "stat:buyScore": { label: "Buy score", "$value": "g.buyTotal().toFixed(1)" },
        "badge:winner": { "$label": "g.recommendation().startsWith('Build') ? 'Recommend: Build' : 'Recommend: Buy'", "$tone": "g.diff() < 10 ? 'warning' : g.recommendation().startsWith('Build') ? 'info' : 'success'" }
      },
      "callout:advice": {
        "$tone": "g.diff() < 10 ? 'warning' : 'info'",
        "$text": "g.diff() < 10 ? 'Both options score very close — consider involving more stakeholders or running a small POC.' : g.recommendation() + ' scores clearly higher. But factor in team capabilities and strategic direction for the final call.'"
      },
      "accordion:detail": {
        multiple: true,
        items: [
          { value: "cost", label: "Cost notes", content: "Lower cost score = better (0 = zero cost, 100 = extremely high). Buy options need extra consideration for vendor lock-in risk." },
          { value: "scope", label: "Core vs non-core strategy", content: "Core business features typically lean toward building to maintain control and differentiation. Non-core features can be bought to free up team bandwidth." },
          { value: "hybrid", label: "Third path: hybrid approach", content: "Consider buying for quick launch while planning an internal build. Migrate once the build matures." }
        ]
      }
    }
  }
}
```


**Build vs Buy decision model essentials:**

- `select` defines feature positioning (core/non-core), influencing the recommendation bias
- Two sets of sliders independently adjust each solution's scores
- `buildTotal()` and `buyTotal()` use weighted formulas for overall scores
- `recommendation()` combines positioning and scores for a recommendation
- Accordion provides additional decision guidance (cost notes, strategy tips, hybrid approach)

This framework turns a subjective decision into comparable score inputs.
