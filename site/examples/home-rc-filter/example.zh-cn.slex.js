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
<div class="rc-filter-demo">
  <div id="inputs" class="rc-filter-grid">
    <div class="rc-filter-field"><slex-input id="r" label="电阻 R" type="engineering" value="10kΩ" placeholder="10kΩ"></slex-input><slex-slider id="rControl" label="R" value="10000" min="1000" max="100000" step="1000" unit="Ω"></slex-slider></div>
    <div class="rc-filter-field"><slex-input id="c" label="电容 C" type="engineering" value="100nF" placeholder="100nF"></slex-input><slex-slider id="cControl" label="C" value="100" min="10" max="1000" step="10" unit="nF"></slex-slider></div>
    <div class="rc-filter-field"><slex-input id="f" label="输入频率 f" type="engineering" value="1kHz" placeholder="1kHz"></slex-input><slex-slider id="fControl" label="f" value="1000" min="0" max="5000" step="10" unit="Hz"></slex-slider></div>
    <div class="rc-filter-field"><slex-input id="vin" label="输入幅值 Vin" type="engineering" value="1V" placeholder="1V"></slex-input><slex-slider id="vinControl" label="Vin" value="1" min="0" max="5" step="0.1" unit="V"></slex-slider></div>
  </div>
  <p id="inputHint" class="rc-filter-muted">试试 4.7kΩ、220nF、10kHz、500mV。value 保留原文，number 参与计算。</p>
  <div id="outputs" class="rc-filter-grid">
    <slex-stat id="tau" label="时间常数" unit="ms" animate-initial></slex-stat>
    <slex-stat id="cutoff" label="截止频率" unit="Hz" animate-initial></slex-stat>
    <slex-stat id="gain" label="幅值增益" animate-initial></slex-stat>
    <slex-stat id="output" label="输出幅值" unit="V" animate-initial></slex-stat>
  </div>
  <div id="formula" class="rc-filter-formula"></div>
  <div class="rc-filter-actions"><p id="status" class="rc-filter-muted"></p><slex-button id="reset" label="重置" variant="secondary"></slex-button></div>
</div>
<style>
  .rc-filter-demo { display: grid; gap: 1rem; min-width: 0; }
  .rc-filter-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; min-width: 0; }
  @media (min-width: 600px) { .rc-filter-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .rc-filter-field { display: grid; align-content: start; gap: 1rem; min-width: 0; }
  .rc-filter-formula { border: 1px solid var(--border); border-radius: var(--radius); background: var(--muted); padding: .625rem .75rem; font-family: var(--font-mono, monospace); font-weight: 600; line-height: 1.7; }
  .rc-filter-muted { margin: 0; color: var(--muted-foreground); font-size: .875rem; line-height: 1.625; }
  .rc-filter-actions { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 1rem; } #status { flex: 1 1 24rem; min-width: 0; }
  @media (max-width: 599px) { .rc-filter-actions { flex-direction: column; align-items: stretch; }
    #status { flex: 0 1 auto; } #reset { width: 100%; } }
</style>
<script type="module">
  const byId = (id) => slex.root.querySelector(\`#\${id}\`);
  const inputs = { r: byId("r"), c: byId("c"), f: byId("f"), vin: byId("vin") };
  const sliders = { r: byId("rControl"), c: byId("cControl"), f: byId("fControl"), vin: byId("vinControl") };
  const defaults = { r: "10kΩ", c: "100nF", f: "1kHz", vin: "1V" };
  const units = { r: "Ω", c: "nF", f: "Hz", vin: "V" };
  const sliderScale = { r: 1, c: 1e9, f: 1, vin: 1 };
  const format = (value, digits) => Number.isFinite(value) ? value.toFixed(digits) : "无效";
  const update = (origin) => {
    const r = inputs.r.valueAsNumber, c = inputs.c.valueAsNumber, f = inputs.f.valueAsNumber, vin = inputs.vin.valueAsNumber;
    const valid = [r, c, f, vin].every(Number.isFinite) && r > 0 && c > 0 && f >= 0 && vin >= 0;
    const tau = valid ? r * c : NaN;
    const cutoff = valid && tau > 0 ? 1 / (2 * Math.PI * tau) : NaN;
    const gain = valid && cutoff > 0 ? 1 / Math.sqrt(1 + (f / cutoff) ** 2) : NaN;
    const gainDb = Number.isFinite(gain) && gain > 0 ? 20 * Math.log10(gain) : NaN;
    const output = Number.isFinite(gain) ? vin * gain : NaN;
    if (origin !== "slider") for (const key of Object.keys(sliders)) { const number = inputs[key].valueAsNumber; if (Number.isFinite(number)) sliders[key].value = String(number * sliderScale[key]); }
    byId("tau").value = format(tau * 1000, 3); byId("cutoff").value = format(cutoff, 2); byId("gain").value = format(gain, 3); byId("output").value = format(output, 3);
    byId("formula").textContent = \`|H(f)| = \${format(gain, 3)}, Gain = \${format(gainDb, 2)} dB\`;
    byId("status").textContent = valid ? "低频接近直通，高频会被一阶 RC 网络衰减。" : "请检查工程输入格式；R、C 必须大于 0，频率和输入幅值不能为负。";
  };
  const onInput = () => update("input");
  const sliderHandlers = Object.fromEntries(Object.keys(sliders).map((key) => [key, () => { inputs[key].value = \`\${sliders[key].value}\${units[key]}\`; update("slider"); }]));
  const reset = () => { for (const [key, value] of Object.entries(defaults)) inputs[key].value = value; update("input"); };
  Object.values(inputs).forEach((control) => control.addEventListener("input", onInput));
  for (const [key, control] of Object.entries(sliders)) control.addEventListener("input", sliderHandlers[key]);
  byId("reset").addEventListener("click", reset); update("input");
  slex.onDispose(() => { Object.values(inputs).forEach((control) => control.removeEventListener("input", onInput)); for (const [key, control] of Object.entries(sliders)) control.removeEventListener("input", sliderHandlers[key]); byId("reset").removeEventListener("click", reset); });
</script>
~~~
`;
