---
title: RC Low-Pass Filter
category: Calculator
status: published
order: 8
summary: A frequency-selective circuit built with a resistor and capacitor — calculate cutoff frequency and gain attenuation at any frequency.
tags: electronics, circuit, filter, rc
components: card, grid, input, slider, stat
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# RC Low-Pass Filter

The cutoff calculation is ordinary JavaScript: \(f_c = 1 / (2\pi RC)\). Values are read from live custom-element properties.

```slex
<slex-card title="RC Low-Pass Filter"><slex-grid columns="2"><slex-input id="resistance" type="number" label="Resistance" unit="kΩ" value="10"></slex-input><slex-input id="capacitance" type="number" label="Capacitance" unit="nF" value="100"></slex-input></slex-grid><slex-stat id="cutoff" label="Cutoff frequency" unit="Hz"></slex-stat></slex-card>
<script type="module">
  const r = slex.root.querySelector("#resistance"); const c = slex.root.querySelector("#capacitance"); const cutoff = slex.root.querySelector("#cutoff");
  const update = () => { cutoff.value = (1 / (2 * Math.PI * Number(r.value) * 1e3 * Number(c.value) * 1e-9)).toFixed(1); };
  r.addEventListener("input", update); c.addEventListener("input", update); update();
  slex.onDispose(() => { r.removeEventListener("input", update); c.removeEventListener("input", update); });
</script>
```

Engineering input values are parsed from the controls and the resulting cutoff/gain values are written as display properties.
