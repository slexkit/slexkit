export default `# First-order RC Low-pass Filter

Use Markdown for derivation, units, and formulas, then let SlexKit own the adjustable parameters. Engineering inputs can be written as \`10kΩ\`, \`100nF\`, and \`1kHz\`.

Cutoff frequency:

$$
f_c = \\frac{1}{2\\pi RC}
$$

Magnitude response:

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
        "text:rLabel": { text: "Resistance R" },
        "input:r": {
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
        "text:cLabel": { text: "Capacitance C" },
        "input:c": {
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
        "text:fLabel": { text: "Input frequency f" },
        "input:f": {
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
        "text:vinLabel": { text: "Input amplitude Vin" },
        "input:vin": {
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
      text: "Try 4.7kΩ, 220nF, 10kHz, and 500mV. value keeps the source text; number drives the calculation.",
      variant: "muted",
    },
    "grid:outputs": {
      columns: 1,
      mdColumns: 4,
      "stat:tau": {
        label: "Time constant",
        $value: "g.format(g.tau() * 1000, 3)",
        unit: "ms",
        animateInitial: true,
      },
      "stat:cutoff": {
        label: "Cutoff frequency",
        $value: "g.format(g.cutoff(), 2)",
        unit: "Hz",
        animateInitial: true,
      },
      "stat:gain": {
        label: "Magnitude gain",
        $value: "g.format(g.gain(), 3)",
        animateInitial: true,
      },
      "stat:vout": {
        label: "Output amplitude",
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
        $text: "g.valid() ? 'Low frequencies pass through; higher frequencies are attenuated by the first-order RC network.' : 'Check the engineering input format. R and C must be greater than 0; frequency and input amplitude cannot be negative.'",
        variant: "muted",
      },
      "button:reset": {
        label: "Reset",
        variant: "secondary",
        onclick: "g.reset()",
      },
    },
  },
}
~~~
`;
