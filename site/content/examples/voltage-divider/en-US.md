---
title: Voltage Divider Calculator
category: Calculator
status: published
order: 7
summary: Enter input voltage and two resistor values to calculate divider output voltage and evaluate load effect error.
tags: electronics, voltage-divider, resistor, circuit
components: card, input, slider, formula, stat, badge, callout, grid, column
difficulty: Beginner
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Voltage Divider Calculator

Two resistors in series, tapping voltage from the middle — the simplest signal conditioning technique in analog circuits. Used everywhere: ADC level shifting, threshold voltage setting, bias voltage generation.

## Core Formula

Unloaded divider: $V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2}$

With load $R_L$: $V_{out,loaded} = V_{in} \times \frac{R_2 \parallel R_L}{R_1 + R_2 \parallel R_L}$

**Key rule of thumb**: Divider impedance ($R_1 \parallel R_2$) should be at least 10× less than the next stage's input impedance.

```slex
{
  slex: "0.1",
  namespace: "example_voltage_divider",
  g: {
    vin: 5, r1: 10000, r2: 10000, rl: 100000,
    rParallel: function () { return this.r2 * this.rl / (this.r2 + this.rl); },
    vout: function () { return this.vin * this.r2 / (this.r1 + this.r2); },
    voutLoaded: function () { return this.vin * this.rParallel() / (this.r1 + this.rParallel()); },
    errorPercent: function () { return Math.abs((this.voutLoaded() - this.vout()) / this.vout() * 100); },
    impedanceRatio: function () { var zout = this.r1 * this.r2 / (this.r1 + this.r2); return this.rl / zout; },
    loadWarning: function () { return this.impedanceRatio() < 10 ? "Load effect significant — increase RL or reduce R1/R2" : "Divider impedance is low enough"; }
  },
  layout: {
    "section:divider": {
      eyebrow: "Calculator",
      title: "Voltage Divider Calculator",
      subtitle: "Two resistors in series, tapping voltage from the middle.",
      "card:divider": {
        title: "Voltage Divider Calculator",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:r1Field": { "input:r1": { label: "R1", "$value": "g.r1", type: "number", unit: "Ω", onchange: "g.r1 = Number($event || 0)" }, "slider:r1": { label: "R1", "$value": "g.r1", min: 100, max: 1000000, step: 100, unit: "Ω", onchange: "g.r1 = Number($event)" } },
        "column:r2Field": { "input:r2": { label: "R2", "$value": "g.r2", type: "number", unit: "Ω", onchange: "g.r2 = Number($event || 0)" }, "slider:r2": { label: "R2", "$value": "g.r2", min: 100, max: 1000000, step: 100, unit: "Ω", onchange: "g.r2 = Number($event)" } }
      },
      "grid:params2": {
        columns: 1, mdColumns: 2,
        "column:vinField": { "input:vin": { label: "Input voltage Vin", "$value": "g.vin", type: "number", unit: "V", onchange: "g.vin = Number($event || 0)" }, "slider:vin": { label: "Vin", "$value": "g.vin", min: 0.1, max: 48, step: 0.1, unit: "V", onchange: "g.vin = Number($event)" } },
        "column:rlField": { "input:rl": { label: "Load resistance RL", "$value": "g.rl", type: "number", unit: "Ω", onchange: "g.rl = Number($event || 0)" }, "slider:rl": { label: "RL", "$value": "g.rl", min: 1000, max: 10000000, step: 1000, unit: "Ω", onchange: "g.rl = Number($event)" } }
      },
      "formula:eq1": { "$tex": "'V_{out} = ' + g.vin.toFixed(1) + ' \\\\times \\\\frac{' + (g.r2/1000).toFixed(1) + '\\\\text{k}}{' + (g.r1/1000).toFixed(1) + '\\\\text{k} + ' + (g.r2/1000).toFixed(1) + '\\\\text{k}} = ' + g.vout().toFixed(3) + '\\\\text{ V}'" },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:vout": { label: "Vout (no load)", "$value": "g.vout().toFixed(3)", unit: "V" },
        "stat:voutLoaded": { label: "Vout (loaded)", "$value": "g.voutLoaded().toFixed(3)", unit: "V" },
        "stat:error": { label: "Load error", "$value": "g.errorPercent().toFixed(2)", unit: "%" },
        "badge:ratio": { "$label": "g.impedanceRatio() < 10 ? '⚠ Load effect' : '✓ Good match'", "$tone": "g.impedanceRatio() < 10 ? 'warning' : 'success'" }
      },
      "callout:warning": { "$tone": "g.impedanceRatio() < 10 ? 'warning' : 'info'", "$text": "g.loadWarning()" }
      }
    }
  }
}
```


## Engineering Notes

| R1 | R2 | Vout/Vin | Impedance |
|----|----|---------|-----------|
| 10k | 10k | 0.50 | 5k |
| 10k | 3.3k | 0.25 | 2.5k |
| 10k | 1k | 0.09 | 909 |
| 33k | 10k | 0.23 | 7.7k |

- **ADC applications**: Divider impedance should be < 1/10 of ADC input impedance; add a buffer op-amp if needed
- **Precision applications**: Use 1% tolerance resistors from the same batch to minimize thermal drift differences
- **Power limits**: $P = V^2/R$ — watch for heating with low-resistance dividers
