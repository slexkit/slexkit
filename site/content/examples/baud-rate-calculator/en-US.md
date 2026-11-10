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

Enter a peripheral clock, target baud rate, and integer divider. The module calculates the actual baud rate and error using 16× oversampling.

```slex
<slex-card title="Baud Rate Error Calculator"><slex-grid columns="3"><slex-input id="clock" type="number" label="Peripheral clock" unit="MHz" value="48" min="0"></slex-input><slex-input id="divider" type="number" label="Divider" value="26" min="1" step="1"></slex-input><slex-input id="target" type="number" label="Target baud" value="115200" min="1"></slex-input></slex-grid><slex-stat id="result" label="Actual baud / error"></slex-stat></slex-card>
<script type="module">
  const fields = ["clock", "divider", "target"].map(id => slex.root.querySelector(`#${id}`));
  const result = slex.root.querySelector("#result");
  const update = () => {
    const [clock, divider, target] = fields.map(field => Number(field.value));
    if (!(clock > 0 && target > 0 && Number.isInteger(divider) && divider > 0)) { result.value = "Enter valid parameters"; return; }
    const baud = clock * 1e6 / (16 * divider);
    result.value = `${baud.toFixed(0)} / ${((baud / target - 1) * 100).toFixed(2)}%`;
  };
  fields.forEach(field => field.addEventListener("input", update)); update();
  slex.onDispose(() => fields.forEach(field => field.removeEventListener("input", update)));
</script>
```

Input values are read from live control properties, and the calculated baud rate and error appear in one stat.
