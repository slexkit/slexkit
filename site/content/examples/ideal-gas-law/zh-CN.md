---
title: 理想气体定律
category: 物理与化学
status: published
order: 53
summary: 输入 P、V、n、T 中的三个，用 PV=nRT 计算第四个，支持切换求解目标。
tags: physics, chemistry, gas, ideal-gas-law
components: card, select, input, formula, stat, callout, grid
difficulty: 进阶
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 理想气体定律

$$PV = nRT \quad (R = 8.314\text{ J/(mol·K)})$$

```slex
{
  slex: "0.1",
  namespace: "example_ideal_gas_law",
  g: {
    solveFor: "p", pressure: 101325, volume: 0.0224, moles: 1, temperature: 273,
    R: 8.314,
    temperatureC: function () { return this.temperature - 273.15; },
    result: function () {
      if (this.solveFor === "p") return this.moles * this.R * this.temperature / this.volume;
      if (this.solveFor === "v") return this.moles * this.R * this.temperature / this.pressure;
      if (this.solveFor === "n") return this.pressure * this.volume / (this.R * this.temperature);
      return this.pressure * this.volume / (this.moles * this.R);
    },
    resultUnit: function () { return this.solveFor === "p" ? "Pa" : this.solveFor === "v" ? "m³" : this.solveFor === "n" ? "mol" : "K"; }
  },
  layout: {
    "card:gas": {
      title: "理想气体 PV=nRT",
      "select:solveFor": { label: "求解目标", "$value": "g.solveFor", options: [{ label: "求 P", value: "p" }, { label: "求 V", value: "v" }, { label: "求 n", value: "n" }, { label: "求 T", value: "t" }], onchange: "g.solveFor = String($event)" },
      "grid:params": {
        columns: 1, mdColumns: 4,
        "input:pressure": { label: "压力 P", "$value": "g.pressure", type: "number", unit: "Pa", onchange: "g.pressure = Number($event || 0)" },
        "input:volume": { label: "体积 V", "$value": "g.volume", type: "number", unit: "m³", onchange: "g.volume = Number($event || 0)" },
        "input:moles": { label: "物质的量 n", "$value": "g.moles", type: "number", unit: "mol", onchange: "g.moles = Number($event || 0)" },
        "input:temperature": { label: "温度 T", "$value": "g.temperature", type: "number", unit: "K", onchange: "g.temperature = Number($event || 0)" }
      },
      "formula:equation": { "$tex": "g.solveFor === 'p' ? 'P = \\\\frac{nRT}{V} = \\\\frac{' + g.moles + ' \\\\times ' + g.R.toFixed(1) + ' \\\\times ' + g.temperature + '}{' + g.volume.toFixed(4) + '}' : g.solveFor === 'v' ? 'V = \\\\frac{nRT}{P} = \\\\frac{' + g.moles + ' \\\\times ' + g.R.toFixed(1) + ' \\\\times ' + g.temperature + '}{' + g.pressure + '}' : g.solveFor === 'n' ? 'n = \\\\frac{PV}{RT} = \\\\frac{' + g.pressure + ' \\\\times ' + g.volume.toFixed(4) + '}{' + g.R.toFixed(1) + ' \\\\times ' + g.temperature + '}' : 'T = \\\\frac{PV}{nR} = \\\\frac{' + g.pressure + ' \\\\times ' + g.volume.toFixed(4) + '}{' + g.moles + ' \\\\times ' + g.R.toFixed(1) + '}'" },
      "grid:results": {
        columns: 1, mdColumns: 2,
        "stat:result": { label: "结果", "$value": "g.result().toFixed(2)", "$unit": "g.resultUnit()" },
        "stat:celsius": { label: "摄氏温度", "$value": "g.temperatureC().toFixed(1)", unit: "°C" }
      },
      "callout:note": { tone: "info", text: "R = 8.314 J/(mol·K)。1 atm = 101325 Pa，标准状况下 1 mol 气体体积约 22.4 L。温度必须用 K。" }
    }
  }
}
```

Fallback：1 mol, 273K, 22.4L → P = 101325 Pa (1 atm)。

- 实际气体修正：Van der Waals 方程 $(P + a/V^2)(V - b) = nRT$
- T(K) = T(°C) + 273.15
