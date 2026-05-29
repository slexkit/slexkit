({
  namespace: "example_basic_resistor",
  g: {
    number(value) {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    },
    valid() {
      return this.number(this.vin.value) > 0 && this.number(this.r1.value) > 0 && this.number(this.r2.value) > 0;
    },
    totalResistance() {
      return this.number(this.r1.value) + this.number(this.r2.value);
    },
    ratio() {
      if (!this.valid()) return NaN;
      return this.number(this.r2.value) / this.totalResistance();
    },
    vout() {
      if (!this.valid()) return NaN;
      return this.number(this.vin.value) * this.ratio();
    },
    currentA() {
      if (!this.valid()) return NaN;
      return this.number(this.vin.value) / this.totalResistance();
    },
    format(value, digits) {
      if (!Number.isFinite(value)) return "Invalid";
      return value.toFixed(digits);
    },
    percent(value) {
      if (!Number.isFinite(value)) return "Invalid";
      return (value * 100).toFixed(2);
    },
    current(value) {
      if (!Number.isFinite(value)) return "Invalid";
      if (Math.abs(value) < 0.001) return (value * 1000000).toFixed(2);
      if (Math.abs(value) < 1) return (value * 1000).toFixed(2);
      return value.toFixed(3);
    },
    currentUnit(value) {
      if (!Number.isFinite(value)) return "";
      if (Math.abs(value) < 0.001) return "uA";
      if (Math.abs(value) < 1) return "mA";
      return "A";
    },
    reset() {
      this.vin.value = 12;
      this.r1.value = 10000;
      this.r2.value = 4700;
    },
  },
  layout: {
    "card:calculator": {
      title: "Voltage divider",
      "callout:unicode": {
        tone: "info",
        title: "Unicode label",
        "text:copy": { text: "中文标签: 输入电压" },
      },
      "grid:inputs": {
        columns: 1,
        mdColumns: 3,
        "column:vinField": {
          "text:vinLabel": { text: "Input voltage Vin (V)" },
          "input:vin": {
            type: "number",
            value: 12,
            placeholder: "12",
          },
        },
        "column:r1Field": {
          "text:r1Label": { text: "High-side resistor R1 (ohm)" },
          "input:r1": {
            type: "number",
            value: 10000,
            placeholder: "10000",
          },
        },
        "column:r2Field": {
          "text:r2Label": { text: "Low-side resistor R2 (ohm)" },
          "input:r2": {
            type: "number",
            value: 4700,
            placeholder: "4700",
          },
        },
      },
      "grid:results": {
        columns: 1,
        mdColumns: 4,
        "stat:vout": {
          label: "Output voltage",
          $value: "g.format(g.vout(), 3)",
          unit: "V",
        },
        "stat:ratio": {
          label: "Divider ratio",
          $value: "g.percent(g.ratio())",
          unit: "%",
        },
        "stat:current": {
          label: "Divider current",
          $value: "g.current(g.currentA())",
          $unit: "g.currentUnit(g.currentA())",
          tone: "warning",
        },
        "stat:totalResistance": {
          label: "Total resistance",
          $value: "g.format(g.totalResistance(), 0)",
          unit: "ohm",
        },
      },
      "text:formula": {
        $text: "'Vout = Vin * R2 / (R1 + R2) = ' + g.format(g.vout(), 3) + ' V'",
      },
      "row:actions": {
        "button:reset": {
          label: "Reset values",
          variant: "secondary",
          onclick: "g.reset()",
        },
      },
    },
  },
})
