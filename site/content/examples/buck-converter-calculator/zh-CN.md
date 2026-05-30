---
title: Buck 电感计算器
category: 电子工程
status: published
order: 11
summary: 输入输入电压、输出电压、负载电流和开关频率，计算 Buck 变换器所需的电感值和纹波电流。
tags: electronics, power, buck, inductor, dc-dc
components: card, input, slider, formula, stat, table, callout, badge, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Buck 电感计算器

Buck（降压）变换器是 DC-DC 电源的核心拓扑。电感是最关键的无源器件——选大了体积和成本上升，选小了纹波电流过大、磁芯可能饱和。

## 核心公式

连续导通模式（CCM）下：

$$L = \frac{(V_{in} - V_{out}) \times D}{f_{sw} \times \Delta I_L}$$

其中 $D = V_{out} / V_{in}$，$\Delta I_L = r \times I_{out}$（$r$ 取 0.2–0.4）。

```slex
{
  slex: "0.1",
  namespace: "example_buck_converter",
  g: {
    vin: 12, vout: 3.3, iout: 2, fsw: 500, rippleRatio: 0.3,
    duty: function () { return this.vout / this.vin; },
    deltaI: function () { return this.rippleRatio * this.iout; },
    inductance: function () { return (this.vin - this.vout) * this.duty() / (this.fsw * 1000 * this.deltaI()) * 1e6; },
    iPeak: function () { return this.iout + this.deltaI() / 2; },
    iSat: function () { return this.iPeak() * 1.3; }
  },
  layout: {
    "card:buck": {
      title: "Buck 电感计算器",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:vinField": { "input:vin": { label: "输入电压 Vin", "$value": "g.vin", type: "number", unit: "V", onchange: "g.vin = Number($event || 0)" }, "slider:vin": { label: "Vin", "$value": "g.vin", min: 3, max: 60, step: 0.1, unit: "V", onchange: "g.vin = Number($event)" } },
        "column:voutField": { "input:vout": { label: "输出电压 Vout", "$value": "g.vout", type: "number", unit: "V", onchange: "g.vout = Number($event || 0)" }, "slider:vout": { label: "Vout", "$value": "g.vout", min: 0.6, max: 55, step: 0.1, unit: "V", onchange: "g.vout = Number($event)" } },
        "column:ioutField": { "input:iout": { label: "负载电流 Iout", "$value": "g.iout", type: "number", unit: "A", onchange: "g.iout = Number($event || 0)" }, "slider:iout": { label: "Iout", "$value": "g.iout", min: 0.1, max: 20, step: 0.1, unit: "A", onchange: "g.iout = Number($event)" } },
        "column:fswField": { "input:fsw": { label: "开关频率 fsw", "$value": "g.fsw", type: "number", unit: "kHz", onchange: "g.fsw = Number($event || 0)" }, "slider:fsw": { label: "fsw", "$value": "g.fsw", min: 50, max: 2000, step: 50, unit: "kHz", onchange: "g.fsw = Number($event)" }, "slider:rippleRatio": { label: "纹波系数 r", "$value": "g.rippleRatio", min: 0.1, max: 0.5, step: 0.05, onchange: "g.rippleRatio = Number($event)" } }
      },
      "formula:calc": { "$tex": "'L = \\\\frac{(' + g.vin.toFixed(1) + ' - ' + g.vout.toFixed(1) + ') \\\\times ' + g.duty().toFixed(3) + '}{' + g.fsw + '\\\\text{k} \\\\times ' + g.deltaI().toFixed(2) + '} = ' + g.inductance().toFixed(1) + '\\\\text{ μH}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:duty": { label: "占空比 D", "$value": "(g.duty() * 100).toFixed(1)", unit: "%" },
        "stat:L": { label: "电感值", "$value": "g.inductance().toFixed(1)", unit: "μH" },
        "stat:iPeak": { label: "峰值电流", "$value": "g.iPeak().toFixed(2)", unit: "A" }
      },
      "callout:advice": { "$tone": "g.inductance() > 1000 ? 'warning' : g.inductance() < 1 ? 'warning' : 'info'", "$text": "g.inductance() > 1000 ? '电感值偏大，考虑降低纹波系数或提高开关频率。' : g.inductance() < 1 ? '电感值过小，可能导致 DCM 或过大纹波。' : '电感值在合理范围。饱和电流需 > ' + g.iSat().toFixed(1) + 'A。'" }
    }
  }
}
```

## 选型与经验值

| 参数 | 推荐范围 | 说明 |
|------|---------|------|
| 纹波系数 r | 0.2–0.4 | 太小则电感过大，太大则纹波过大 |
| 开关频率 | 100kHz–2MHz | 高频率缩小电感但增大开关损耗 |
| 饱和电流裕量 | ≥ 1.3 × Ipeak | 防止瞬态负载导致磁芯饱和 |

**E-series 标准电感值（μH）**：1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2, 10, 15, 22, 33, 47, 68

- DCR 小的电感效率高但体积大；用屏蔽电感减少 EMI
- 输出电容和电感组成 LC 滤波器，ESR 影响输出纹波
- DCM 边界：$I_{out} < \Delta I_L / 2$ 时进入断续模式，轻载效率会下降
