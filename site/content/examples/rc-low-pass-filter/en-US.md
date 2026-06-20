---
title: RC Low-Pass Filter
category: Calculator
status: published
order: 8
summary: A frequency-selective circuit built with a resistor and capacitor — calculate cutoff frequency and gain attenuation at any frequency.
tags: electronics, circuit, filter, rc
components: card, input, slider, formula, stat, table, callout, badge
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# RC Low-Pass Filter

The RC low-pass filter is the most basic passive filter in analog circuits — one resistor and one capacitor can filter high-frequency noise from a signal path. Used in ADC anti-aliasing, audio de-hissing, and PWM output smoothing.

## Core Formula

Cutoff frequency $f_c$ (−3 dB point):

$$f_c = \frac{1}{2\pi RC}$$

For an input signal at frequency $f$, the output amplitude gain is:

$$|H(f)| = \frac{1}{\sqrt{1 + (f/f_c)^2}}$$

## Parameter Input

```slex
{
  slex: "0.1",
  namespace: "example_rc_low_pass_filter",
  g: {
    r: 10000,
    c: 100,
    f: 1000,
    cLabel: function () { return String(Math.round(this.c * 1000) / 1000); },
    cutoff: function () { return 1 / (2 * Math.PI * this.r * this.c * 1e-9); },
    gain: function () { return 1 / Math.sqrt(1 + Math.pow(this.f / this.cutoff(), 2)); },
    gainDb: function () { return (20 * Math.log10(this.gain())).toFixed(1); },
    regimeLabel: function () { return this.f < this.cutoff() * 0.1 ? "Passband" : this.f > this.cutoff() * 10 ? "Stopband" : "Transition"; }
  },
  layout: {
    "section:params": {
      title: "RC Low-Pass Filter",
      subtitle: "One resistor and one capacitor — filter out high-frequency noise.",
      "card:params": {
        title: "Parameter Input",
      "grid:inputs": {
        columns: 1, mdColumns: 3,
        "column:rField": { "input:rInput": { label: "Resistance R", "$value": "std.units.si(g.r, 'Ω', 1)", type: "engineering", unit: "Ω", placeholder: "10kΩ", onchange: "if ($event.valid && $event.number > 0) g.r = $event.number" }, "slider:rSlider": { label: "R", "$value": "g.r", min: 100, max: 100000, step: 100, unit: "Ω", onchange: "g.r = Number($event)" } },
        "column:cField": { "input:cInput": { label: "Capacitance C", "$value": "g.cLabel() + 'nF'", type: "engineering", unit: "nF", placeholder: "100nF", onchange: "if ($event.valid && $event.number > 0) g.c = $event.unit ? $event.number * 1e9 : $event.number" }, "slider:cSlider": { label: "C", "$value": "g.c", min: 1, max: 1000, step: 1, unit: "nF", onchange: "g.c = Number($event)" } },
        "column:fField": { "input:fInput": { label: "Input frequency f", "$value": "std.units.si(g.f, 'Hz', 1)", type: "engineering", unit: "Hz", placeholder: "1kHz", onchange: "if ($event.valid && $event.number >= 0) g.f = $event.number" }, "slider:fSlider": { label: "f", "$value": "g.f", min: 1, max: 100000, step: 1, unit: "Hz", onchange: "g.f = Number($event)" } }
      },
      "stat:fc": { label: "Cutoff frequency", "$value": "g.cutoff().toFixed(1)", unit: "Hz" },
      "badge:regime": { "$label": "g.regimeLabel()", "$tone": "g.f < g.cutoff() * 0.1 ? 'success' : g.f > g.cutoff() * 10 ? 'danger' : 'warning'" }
      }
    }
  }
}
```


## Results

```slex
{
  slex: "0.1",
  namespace: "example_rc_low_pass_filter",
  layout: {
    "column:results": {
      "formula:fc_eq": { "$tex": "'f_c = \\\\frac{1}{2\\\\pi \\\\times ' + (g.r/1000).toFixed(1) + 'k\\\\Omega \\\\times ' + g.cLabel() + '\\\\text{nF}} = ' + g.cutoff().toFixed(1) + '\\\\text{ Hz}'" },
      "row:metrics": {
        "stat:gain_val": { label: "Magnitude gain |H(f)|", "$value": "g.gain().toFixed(4)" },
        "stat:gain_db": { label: "Gain", "$value": "g.gainDb()", unit: "dB", "$tone": "g.f < g.cutoff() * 0.1 ? 'success' : g.f > g.cutoff() * 10 ? 'danger' : 'warning'" }
      },
      "callout:verdict": { "$tone": "g.f < g.cutoff() * 0.1 ? 'success' : g.f > g.cutoff() * 10 ? 'danger' : 'warning'", "$text": "g.f < g.cutoff() * 0.1 ? 'Signal passes through intact — attenuation < 0.04 dB.' : g.f > g.cutoff() * 10 ? 'Signal is heavily attenuated by over 20 dB — the filter is working effectively.' : 'Signal is in the transition band — attenuation is about ' + (-20 * Math.log10(1 / Math.sqrt(1 + Math.pow(g.f / g.cutoff(), 2)))).toFixed(1) + ' dB.'" }
    }
  }
}
```


## Selection Guide

Below are common parameter combinations for typical scenarios. Set the cutoff frequency to 5–10× the highest signal frequency to ensure a flat passband.

```slex
{
  slex: "0.1",
  namespace: "example_rc_low_pass_filter",
  layout: {
    "card:selection": {
      title: "Selection Guide",
      "table:guide": {
        columns: ["R", "C", "fc", "Typical Use"],
        rows: [
          ["1 kΩ", "100 nF", "1592 Hz", "Audio low-pass"],
          ["10 kΩ", "100 nF", "159 Hz", "ADC anti-aliasing"],
          ["100 kΩ", "10 nF", "159 Hz", "PWM smoothing"],
          ["1 kΩ", "1 µF", "159 Hz", "Power ripple filtering"],
          ["10 kΩ", "1 nF", "15915 Hz", "High-frequency noise suppression"]
        ]
      },
      "callout:tip": { "$tone": "g.cutoff() < 100 ? 'info' : g.cutoff() > 10000 ? 'warning' : 'success'", "$text": "g.cutoff() < 100 ? 'Low cutoff frequency — suitable for power filtering and slow signals.' : g.cutoff() > 10000 ? 'High cutoff frequency — may not effectively filter high-frequency noise.' : 'Current cutoff frequency suits most applications.'" }
    }
  }
}
```


## Engineering Notes

- **R value**: Too high increases output impedance and load effects; too high increases thermal noise. 1kΩ–100kΩ is the common range
- **C value**: nF-range NP0/C0G ceramic capacitors have low thermal drift and high precision; above 100nF, consider film capacitors
- **Load effect**: Next-stage input impedance should be > 10× R, otherwise $f_c$ will shift
- **Cascading**: Two RC stages in series give −40 dB/decade second-order rolloff, but cutoff drops to ~$0.37f_c$

| $f/f_c$ | Gain | Attenuation |
|:---:|:---:|:---:|
| 0.1 | 0.995 | −0.04 dB |
| 1.0 | 0.707 | −3 dB |
| 5.0 | 0.196 | −14.2 dB |
| 10.0 | 0.100 | −20 dB |
