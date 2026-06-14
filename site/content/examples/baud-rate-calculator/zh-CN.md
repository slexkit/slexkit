---
title: 波特率误差计算器
category: 计算器
status: published
order: 9
summary: 输入晶振频率和目标波特率，计算 UART 波特率误差百分比，判断通信可靠性。
tags: electronics, uart, baud-rate, serial, crystal
components: card, input, select, formula, stat, table, badge, callout, grid
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 波特率误差计算器

嵌入式开发中，UART 波特率由系统时钟分频得到。晶振频率不能整除目标波特率时会产生误差，误差超过 ±2% 通信就可能丢帧。

## 核心公式

$$Error = \frac{|BR_{actual} - BR_{target}|}{BR_{target}} \times 100\%$$

实际波特率 $BR_{actual} = f_{osc} / (16 \times N)$，其中 $N = \text{round}(f_{osc} / (16 \times BR_{target}))$ 为分频寄存器整数。

```slex
{
  slex: "0.1",
  namespace: "example_baud_rate_calculator",
  g: {
    freq: 8,
    freqUnit: "MHz",
    baud: 115200,
    freqHz: function () { var m = { MHz: 1e6, kHz: 1e3, Hz: 1 }; return this.freq * (m[this.freqUnit] || 1e6); },
    divisor: function () { return this.freqHz() / (16 * this.baud); },
    regValue: function () { return Math.round(this.divisor()); },
    actualBaud: function () { return this.freqHz() / (16 * this.regValue()); },
    error: function () { return Math.abs((this.actualBaud() - this.baud) / this.baud * 100); },
    reliability: function () { var e = this.error(); return e < 0.5 ? "优秀" : e < 2 ? "可接受" : e < 5 ? "有风险" : "不可用"; },
    tone: function () { var e = this.error(); return e < 0.5 ? "success" : e < 2 ? "info" : e < 5 ? "warning" : "danger"; }
  },
  layout: {
    "section:baud": {
      eyebrow: "计算器",
      title: "波特率误差计算器",
      subtitle: "输入晶振频率和目标波特率，计算误差。",
      "card:baud": {
        title: "波特率误差计算器",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:freqField": {
          "input:freq": { label: "晶振频率", "$value": "g.freq", type: "number", unit: "MHz", onchange: "g.freq = Number($event || 0)" }
        },
        "column:baudField": {
          "select:baud": { label: "目标波特率", "$value": "g.baud", options: [{ label: "9600", value: 9600 }, { label: "19200", value: 19200 }, { label: "38400", value: 38400 }, { label: "57600", value: 57600 }, { label: "115200", value: 115200 }, { label: "230400", value: 230400 }, { label: "460800", value: 460800 }], onchange: "g.baud = Number($event)" }
        },
        "column:unitField": {
          "select:unit": { label: "频率单位", "$value": "g.freqUnit", options: [{ label: "MHz", value: "MHz" }, { label: "kHz", value: "kHz" }, { label: "Hz", value: "Hz" }], onchange: "g.freqUnit = String($event)" }
        },
        "column:divField": {
          "stat:divisor": { label: "分频比", "$value": "g.divisor().toFixed(3)" }
        }
      },
      "formula:equation": { "$tex": "'\\\\text{Error} = \\\\frac{|' + g.actualBaud().toFixed(0) + ' - ' + g.baud + '|}{' + g.baud + '} \\\\times 100\\\\% = ' + g.error().toFixed(2) + '\\\\%'" },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:actualBaud": { label: "实际波特率", "$value": "g.actualBaud().toFixed(0)", unit: "bps" },
        "stat:error": { label: "误差", "$value": "g.error().toFixed(2)", unit: "%" },
        "badge:reliability": { "$label": "g.reliability()", "$tone": "g.tone()" },
        "stat:regValue": { label: "寄存器值", "$value": "g.regValue()" }
      },
      "callout:advice": { "$tone": "g.tone()", "$text": "g.error() < 0.5 ? '误差极小，通信可靠。' : g.error() < 2 ? '误差在可接受范围内（<2%），绝大多数场景可用。' : g.error() < 5 ? '误差偏大，长帧通信可能失败，建议更换晶振或降低波特率。' : '误差过大，通信不可靠。请选择能整除的晶振频率。'" }
      }
    }
  }
}
```

Fallback：8MHz 晶振 @ 115200bps → 寄存器值 4, 实际波特率 125000, 误差 8.51%。

## 常用晶振频率与波特率误差表

| 晶振 | 9600 | 19200 | 38400 | 57600 | 115200 |
|------|------|-------|-------|-------|--------|
| 1.8432 MHz | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 3.6864 MHz | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 4.0000 MHz | 8.51 | 8.51 | 8.51 | 8.51 | 8.51 |
| 7.3728 MHz | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 8.0000 MHz | 8.51 | 8.51 | 8.51 | 8.51 | 8.51 |
| 11.0592 MHz | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 14.7456 MHz | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 16.0000 MHz | 8.51 | 8.51 | 8.51 | 8.51 | 8.51 |

**工程笔记**：

- 零误差的关键：晶振频率能被 $16 \times BR$ 整除
- **11.0592 MHz** 是 UART 最经典的选择，对所有标准波特率零误差
- **7.3728 MHz** 和 **14.7456 MHz** 同样零误差
- 错误 < 2% 在实际工程中通常可工作，但高速长帧场景建议 < 1%
