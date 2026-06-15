---
title: RC 低通滤波器
category: 计算器
status: published
order: 8
summary: 用电阻和电容搭建的频率选择电路，计算截止频率和任意频率下的增益衰减。
tags: electronics, circuit, filter, rc
components: card, input, slider, formula, stat, table, callout, badge
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# RC 低通滤波器

RC 低通滤波器是模拟电路中最基础的无源滤波器——一个电阻加一个电容，就能把高频噪声从信号路径上滤掉。做 ADC 前端抗混叠、音频去嘶声、PWM 平滑输出，都会用到它。

## 核心公式

截止频率 $f_c$（-3dB 点）：

$$f_c = \frac{1}{2\pi RC}$$

对于任意频率 $f$ 的输入信号，输出幅度增益为：

$$|H(f)| = \frac{1}{\sqrt{1 + (f/f_c)^2}}$$

## 参数区

```slex
{
  slex: "0.1",
  namespace: "example_rc_low_pass_filter",
  g: {
    r: 10000,
    c: 100,
    f: 1000,
    cutoff: function () { return 1 / (2 * Math.PI * this.r * this.c * 1e-9); },
    gain: function () { return 1 / Math.sqrt(1 + Math.pow(this.f / this.cutoff(), 2)); },
    gainDb: function () { return (20 * Math.log10(this.gain())).toFixed(1); },
    regimeLabel: function () { return this.f < this.cutoff() * 0.1 ? "通带" : this.f > this.cutoff() * 10 ? "阻带" : "过渡带"; }
  },
  layout: {
    "section:params": {
      eyebrow: "计算器",
      title: "RC 低通滤波器",
      subtitle: "一个电阻加一个电容，把高频噪声滤掉。",
      "card:params": {
        title: "参数输入",
      "grid:inputs": {
        columns: 1, mdColumns: 2,
        "column:rField": { "input:r": { label: "电阻 R", "$value": "g.r", type: "number", unit: "Ω", onchange: "g.r = Number($event || 0)" }, "slider:r": { label: "R", "$value": "g.r", min: 100, max: 100000, step: 100, unit: "Ω", onchange: "g.r = Number($event)" } },
        "column:cField": { "input:c": { label: "电容 C", "$value": "g.c", type: "number", unit: "nF", onchange: "g.c = Number($event || 0)" }, "slider:c": { label: "C", "$value": "g.c", min: 1, max: 1000, step: 1, unit: "nF", onchange: "g.c = Number($event)" } },
        "column:fField": { "input:f": { label: "输入频率 f", "$value": "g.f", type: "number", unit: "Hz", onchange: "g.f = Number($event || 0)" }, "slider:f": { label: "f", "$value": "g.f", min: 1, max: 100000, step: 1, unit: "Hz", onchange: "g.f = Number($event)" } }
      },
      "stat:fc": { label: "截止频率", "$value": "g.cutoff().toFixed(1)", unit: "Hz" },
      "badge:regime": { "$label": "g.regimeLabel()", "$tone": "g.f < g.cutoff() * 0.1 ? 'success' : g.f > g.cutoff() * 10 ? 'danger' : 'warning'" }
      }
    }
  }
}
```


## 计算结果

```slex
{
  slex: "0.1",
  namespace: "example_rc_low_pass_filter",
  layout: {
    "card:results": {
      title: "计算结果",
      "formula:fc_eq": { "$tex": "'f_c = \\\\frac{1}{2\\\\pi \\\\times ' + (g.r/1000).toFixed(1) + 'k\\\\Omega \\\\times ' + g.c + '\\\\text{nF}} = ' + g.cutoff().toFixed(1) + '\\\\text{ Hz}'" },
      "stat:gain_val": { label: "幅值增益 |H(f)|", "$value": "g.gain().toFixed(4)" },
      "stat:gain_db": { label: "增益", "$value": "g.gainDb()", unit: "dB" },
      "callout:verdict": { "$tone": "g.f < g.cutoff() * 0.1 ? 'success' : g.f > g.cutoff() * 10 ? 'danger' : 'warning'", "$text": "g.f < g.cutoff() * 0.1 ? '信号完整通过，衰减 < 0.04 dB。' : g.f > g.cutoff() * 10 ? '信号被强烈衰减超过 20 dB，滤波器有效工作。' : '信号处于过渡带，衰减约 ' + (-20 * Math.log10(1 / Math.sqrt(1 + Math.pow(g.f / g.cutoff(), 2)))).toFixed(1) + ' dB。'" }
    }
  }
}
```


## 选型参考

下表是常见场景下的经验参数组合。把截止频率设为目标信号最高频率的 5-10 倍，可以保证通带平坦。

```slex
{
  slex: "0.1",
  namespace: "example_rc_low_pass_filter",
  layout: {
    "card:selection": {
      title: "选型建议",
      "table:guide": {
        columns: ["R", "C", "fc", "典型用途"],
        rows: [
          ["1 kΩ", "100 nF", "1592 Hz", "音频低通"],
          ["10 kΩ", "100 nF", "159 Hz", "ADC 抗混叠"],
          ["100 kΩ", "10 nF", "159 Hz", "PWM 平滑"],
          ["1 kΩ", "1 µF", "159 Hz", "电源纹波滤波"],
          ["10 kΩ", "1 nF", "15915 Hz", "高频噪声抑制"]
        ]
      },
      "callout:tip": { "$tone": "g.cutoff() < 100 ? 'info' : g.cutoff() > 10000 ? 'warning' : 'success'", "$text": "g.cutoff() < 100 ? '低截止频率适合电源滤波和慢信号。' : g.cutoff() > 10000 ? '高截止频率可能无法有效滤除高频噪声。' : '当前截止频率适合大多数应用场景。'" }
    }
  }
}
```


## 工程笔记

- **R 取值**：太大会增加输出阻抗和后级负载效应；太大会增大热噪声。1kΩ–100kΩ 是常用范围
- **C 取值**：nF 级 NP0/C0G 陶瓷电容温漂小、精度高；超过 100nF 考虑薄膜电容
- **负载效应**：后级输入阻抗应至少 > 10 × R，否则 $f_c$ 会偏移
- **级联**：两级 RC 串联可得到 -40dB/dec 的二阶滚降，但截止频率会降低到约 $0.37f_c$

| $f/f_c$ | 增益 | 衰减 |
|:---:|:---:|:---:|
| 0.1 | 0.995 | -0.04 dB |
| 1.0 | 0.707 | -3 dB |
| 5.0 | 0.196 | -14.2 dB |
| 10.0 | 0.100 | -20 dB |
