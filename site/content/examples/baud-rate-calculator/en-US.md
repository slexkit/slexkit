---
title: Baud Rate Error Calculator
category: Calculator
status: published
order: 9
summary: Enter crystal frequency and target baud rate to calculate UART baud rate error percentage and judge communication reliability.
tags: electronics, uart, baud-rate, serial, crystal
components: card, grid, input, slider, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Baud Rate Error Calculator

Enter a peripheral clock and divider; the module computes baud rate and error against a 115200 target.

```slex
<slex-card title="Baud Rate Error Calculator"><slex-grid columns="2"><slex-input id="clock" type="number" label="Peripheral clock" unit="MHz" value="48"></slex-input><slex-input id="divider" type="number" label="Divider" value="26"></slex-input></slex-grid><slex-stat id="result" label="Actual baud / error"></slex-stat></slex-card>
<script type="module">
  const clock = slex.root.querySelector("#clock"); const divider = slex.root.querySelector("#divider"); const result = slex.root.querySelector("#result");
  const update = () => { const baud = Number(clock.value) * 1e6 / (16 * Number(divider.value)); const error = (baud / 115200 - 1) * 100; result.value = `${baud.toFixed(0)} / ${error.toFixed(2)}%`; };
  clock.addEventListener("input", update); divider.addEventListener("input", update); update(); slex.onDispose(() => { clock.removeEventListener("input", update); divider.removeEventListener("input", update); });
</script>
```

Input values are read from live control properties, and the calculated baud/error values are written to the two stat elements.
