---
title: "Branching: Mode Selector"
category: "Getting Started"
status: published
order: 4
summary: "Use select to switch the mode state and render different inputs and results."
tags: select, branching, conditional
components: card, select, input, stat, text
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Branching: Mode Selector

Choose a length, weight, or temperature conversion. The input and result update with the selected mode.

```slex
<slex-card title="Unit conversion">
  <slex-select id="mode" label="Conversion mode"><option value="length">Centimeters → meters</option><option value="weight">Kilograms → pounds</option><option value="temperature">Celsius → Fahrenheit</option></slex-select>
  <slex-input id="amount" type="number" label="Value (cm)" value="100"></slex-input>
  <slex-stat id="result" label="Result"></slex-stat>
  <slex-text id="description"></slex-text>
</slex-card>
<script type="module">
  const mode = slex.root.querySelector("#mode");
  const amount = slex.root.querySelector("#amount");
  const result = slex.root.querySelector("#result");
  const description = slex.root.querySelector("#description");
  const modes = {
    length: { label: "Value (cm)", description: "Divide centimeters by 100 to obtain meters.", convert: n => `${(n / 100).toFixed(2)} m` },
    weight: { label: "Value (kg)", description: "Multiply kilograms by 2.20462 to obtain pounds.", convert: n => `${(n * 2.20462).toFixed(2)} lb` },
    temperature: { label: "Value (°C)", description: "Multiply Celsius by 9/5, then add 32.", convert: n => `${(n * 9 / 5 + 32).toFixed(1)} °F` },
  };
  const update = () => {
    const selected = modes[mode.value] || modes.length;
    const number = amount.value === "" ? NaN : Number(amount.value);
    amount.label = selected.label;
    description.text = selected.description;
    result.value = Number.isFinite(number) ? selected.convert(number) : "Enter a number";
  };
  mode.addEventListener("change", update);
  amount.addEventListener("input", update);
  update();
  slex.onDispose(() => { mode.removeEventListener("change", update); amount.removeEventListener("input", update); });
</script>
```

Native events drive the mode and input value; listeners are removed when the document is disposed.
