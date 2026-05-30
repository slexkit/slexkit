---
title: 功耗与结温估算
category: 电子工程
status: published
order: 14
summary: 输入电压、电流和环境温度，选择封装类型，估算器件结温和热安全裕量。
tags: electronics, thermal, power, junction, heatsink
components: card, input, select, formula, stat, table, badge, callout, grid, column
difficulty: 进阶
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 功耗与结温估算

半导体器件的失效有超过 50% 与温度相关。知道功耗和封装热阻，就能估算结温，判断是否需要散热片。

## 核心公式

$$T_J = T_A + P_D \times \theta_{JA}$$

带散热片时：$T_J = T_A + P_D \times (\theta_{JC} + \theta_{CS} + \theta_{SA})$

```slex
{
  slex: "0.1",
  namespace: "example_power_dissipation",
  g: {
    voltage: 5, current: 0.1, tambient: 25, tjmax: 150, thetaJa: 200, pkg: "SOIC-8",
    power: function () { return this.voltage * this.current; },
    tJunction: function () { return this.tambient + this.power() * this.thetaJa; },
    margin: function () { return this.tjmax - this.tJunction(); },
    safetyLevel: function () { var m = this.margin(); return m < 0 ? "超限" : m < 20 ? "危险" : m < 50 ? "注意" : "安全"; },
    tone: function () { var m = this.margin(); return m < 0 ? "danger" : m < 20 ? "warning" : m < 50 ? "info" : "success"; },
    thetaJaFromPkg: function () { var map = { "SOT-23": 350, "SOT-89": 160, "SOIC-8": 200, "QFN-16": 50, "QFN-32": 35, "DPAK": 90, "TO-220": 60, "TO-220+散热片": 25 }; return map[this.pkg] || 200; }
  },
  layout: {
    "card:thermal": {
      title: "功耗与结温估算",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:vField": { "input:voltage": { label: "电压 V", "$value": "g.voltage", type: "number", unit: "V", onchange: "g.voltage = Number($event || 0)" }, "slider:voltage": { label: "V", "$value": "g.voltage", min: 0.1, max: 60, step: 0.1, unit: "V", onchange: "g.voltage = Number($event)" } },
        "column:iField": { "input:current": { label: "电流 I", "$value": "g.current", type: "number", unit: "A", onchange: "g.current = Number($event || 0)" }, "slider:current": { label: "I", "$value": "g.current", min: 0.01, max: 5, step: 0.01, unit: "A", onchange: "g.current = Number($event)" } }
      },
      "grid:params2": {
        columns: 1, mdColumns: 3,
        "select:pkg": { label: "封装", "$value": "g.pkg", options: [{ label: "SOT-23 (350°C/W)", value: "SOT-23" }, { label: "SOIC-8 (200°C/W)", value: "SOIC-8" }, { label: "QFN-16 (50°C/W)", value: "QFN-16" }, { label: "QFN-32 (35°C/W)", value: "QFN-32" }, { label: "DPAK (90°C/W)", value: "DPAK" }, { label: "TO-220 (60°C/W)", value: "TO-220" }, { label: "TO-220+散热片 (25°C/W)", value: "TO-220+散热片" }], onchange: "g.pkg = String($event); g.thetaJa = g.thetaJaFromPkg()" },
        "input:tambient": { label: "环境温度 TA", "$value": "g.tambient", type: "number", unit: "°C", onchange: "g.tambient = Number($event || 0)" },
        "stat:power": { label: "功耗 PD", "$value": "g.power().toFixed(3)", unit: "W" }
      },
      "formula:equation": { "$tex": "'T_J = ' + g.tambient + ' + ' + g.power().toFixed(2) + ' \\\\times ' + g.thetaJa + ' = ' + g.tJunction().toFixed(1) + '\\\\text{ °C}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:tjunction": { label: "结温 TJ", "$value": "g.tJunction().toFixed(1)", unit: "°C" },
        "stat:margin": { label: "温度裕量", "$value": "g.margin().toFixed(1)", unit: "°C" },
        "badge:safety": { "$label": "g.safetyLevel()", "$tone": "g.tone()" }
      },
      "callout:advice": { "$tone": "g.tone()", "$text": "g.margin() < 0 ? '结温超过 TJmax！必须降低功耗或更换低热阻封装。' : g.margin() < 20 ? '裕量不足（<20°C），建议增加散热片。' : g.margin() < 50 ? '裕量有限，注意高温环境降额。' : '热设计安全，裕量充足。'" }
    }
  }
}
```

Fallback：5V @ 0.1A, SOIC-8 → 功耗 0.5W, 结温 125°C, 裕量 25°C。

## 常见封装热阻参考

| 封装 | θJA (°C/W) | 适用功耗（无散热片） |
|------|-----------|-------------------|
| SOT-23 | 350 | < 0.1 W |
| SOIC-8 | 200 | < 0.2 W |
| QFN-16 | 50 | < 1.5 W |
| QFN-32 | 35 | < 2 W |
| DPAK | 90 | < 1 W |
| TO-220 | 60 | < 1.5 W |
| TO-220 + 散热片 | 25 | < 3 W |

- QFN 封装底部焊盘焊接大面积铜箔可降低热阻至 < 20°C/W
- 高温环境（> 70°C）下结温裕量应留 > 30°C
- 多器件共用 PCB 时需考虑热耦合效应
