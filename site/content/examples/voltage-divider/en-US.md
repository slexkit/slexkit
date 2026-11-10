---
title: Voltage Divider Calculator
category: Calculator
status: published
order: 7
summary: Enter input voltage and two resistor values to calculate divider output voltage and evaluate load effect error.
tags: electronics, voltage-divider, resistor, circuit
components: card, grid, input, slider, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Voltage Divider Calculator

The module script implements \(V_{out} = V_{in} R_2 / (R_1 + R_2)\) with native `input` events.

```slex
<slex-card title="Voltage Divider Calculator"><slex-grid columns="3"><slex-input id="vin" type="number" label="Input voltage" value="12"></slex-input><slex-input id="r1" type="number" label="R1" unit="kΩ" value="10"></slex-input><slex-input id="r2" type="number" label="R2" unit="kΩ" value="20"></slex-input></slex-grid><slex-stat id="vout" label="Output voltage" unit="V"></slex-stat></slex-card>
<script type="module">
  const fields = ["vin", "r1", "r2"].map(id => slex.root.querySelector(`#${id}`)); const vout = slex.root.querySelector("#vout");
  const update = () => { const [vin, r1, r2] = fields.map(field => Number(field.value)); vout.value = (vin * r2 / (r1 + r2)).toFixed(2); };
  fields.forEach(field => field.addEventListener("input", update)); update();
  slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

The three engineering inputs drive one calculation function, which updates output voltage and load-error display properties.
