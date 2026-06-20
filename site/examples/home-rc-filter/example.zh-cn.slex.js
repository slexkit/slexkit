export default `# 一阶 RC 低通滤波器

用 Markdown 写推导、单位和公式，把可调参数交给 SlexKit。工程输入可以直接写 \`10kΩ\`、\`100nF\`、\`1kHz\`。

截止频率：

$$
f_c = \\frac{1}{2\\pi RC}
$$

幅频响应：

$$
|H(f)| = \\frac{1}{\\sqrt{1 + (f / f_c)^2}}
$$

~~~slex
{
  slex: "0.1",
  namespace: "home_rc_filter",
  g: {
    resistance: function () {
      return this.r.number ?? NaN;
    },
    capacitance: function () {
      return this.c.number ?? NaN;
    },
    frequency: function () {
      return this.f.number ?? NaN;
    },
    inputVoltage: function () {
      return this.vin.number ?? NaN;
    },
    valid: function () {
      return this.r.valid && this.c.valid && this.f.valid && this.vin.valid &&
        this.resistance() > 0 && this.capacitance() > 0 && this.frequency() >= 0 && this.inputVoltage() >= 0;
    },
    tau: function () {
      if (!this.valid()) return NaN;
      return this.resistance() * this.capacitance();
    },
    cutoff: function () {
      const tau = this.tau();
      return Number.isFinite(tau) && tau > 0 ? 1 / (2 * Math.PI * tau) : NaN;
    },
    gain: function () {
      const cutoff = this.cutoff();
      if (!Number.isFinite(cutoff) || cutoff <= 0) return NaN;
      return 1 / Math.sqrt(1 + Math.pow(this.frequency() / cutoff, 2));
    },
    gainDb: function () {
      const gain = this.gain();
      return Number.isFinite(gain) && gain > 0 ? 20 * Math.log10(gain) : NaN;
    },
    outputVoltage: function () {
      const gain = this.gain();
      return Number.isFinite(gain) ? this.inputVoltage() * gain : NaN;
    },
    format: function (value, digits) {
      if (!Number.isFinite(value)) return "Invalid";
      return value.toFixed(digits);
    },
    reset: function () {
      this.r.value = "10kΩ";
      this.c.value = "100nF";
      this.f.value = "1kHz";
      this.vin.value = "1V";
    },
  },
  layout: {
    "grid:inputs": {
      columns: 1,
      mdColumns: 4,
      "column:rField": {
        "input:r": {
          label: "电阻 R",
          type: "engineering",
          value: "10kΩ",
          placeholder: "10kΩ",
        },
        "slider:rControl": {
          label: "R",
          $value: "g.r.number",
          min: 1000,
          max: 100000,
          step: 1000,
          unit: "Ω",
          onchange: "g.r.value = $event + 'Ω'",
        },
      },
      "column:cField": {
        "input:c": {
          label: "电容 C",
          type: "engineering",
          value: "100nF",
          placeholder: "100nF",
        },
        "slider:cControl": {
          label: "C",
          $value: "g.c.number * 1e9",
          min: 10,
          max: 1000,
          step: 10,
          unit: "nF",
          onchange: "g.c.value = $event + 'nF'",
        },
      },
      "column:fField": {
        "input:f": {
          label: "输入频率 f",
          type: "engineering",
          value: "1kHz",
          placeholder: "1kHz",
        },
        "slider:fControl": {
          label: "f",
          $value: "g.f.number",
          min: 0,
          max: 5000,
          step: 10,
          unit: "Hz",
          onchange: "g.f.value = $event + 'Hz'",
        },
      },
      "column:vinField": {
        "input:vin": {
          label: "输入幅值 Vin",
          type: "engineering",
          value: "1V",
          placeholder: "1V",
        },
        "slider:vinControl": {
          label: "Vin",
          $value: "g.vin.number",
          min: 0,
          max: 5,
          step: 0.1,
          unit: "V",
          onchange: "g.vin.value = $event + 'V'",
        },
      },
    },
    "text:inputHint": {
      text: "试试 4.7kΩ、220nF、10kHz、500mV。value 保留原文，number 参与计算。",
      variant: "muted",
    },
    "grid:outputs": {
      columns: 1,
      mdColumns: 4,
      "stat:tau": {
        label: "时间常数",
        $value: "g.format(g.tau() * 1000, 3)",
        unit: "ms",
        animateInitial: true,
      },
      "stat:cutoff": {
        label: "截止频率",
        $value: "g.format(g.cutoff(), 2)",
        unit: "Hz",
        animateInitial: true,
      },
      "stat:gain": {
        label: "幅值增益",
        $value: "g.format(g.gain(), 3)",
        animateInitial: true,
      },
      "stat:vout": {
        label: "输出幅值",
        $value: "g.format(g.outputVoltage(), 3)",
        unit: "V",
        animateInitial: true,
      },
    },
    "text:formula": {
      class: "slex-formula-line",
      $text: "'|H(f)| = ' + g.format(g.gain(), 3) + ', Gain = ' + g.format(g.gainDb(), 2) + ' dB'",
    },
    "row:actions": {
      "text:status": {
        $text: "g.valid() ? '低频接近直通，高频会被一阶 RC 网络衰减。' : '请检查工程输入格式；R、C 必须大于 0，频率和输入幅值不能为负。'",
        variant: "muted",
      },
      "button:reset": {
        label: "重置",
        variant: "secondary",
        onclick: "g.reset()",
      },
    },
  },
}
~~~
`;
