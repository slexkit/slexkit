export const htmlCalculator = `<slex-card title="功率计算器">
  <slex-input id="voltage" label="电压" type="engineering" value="12" unit="V"></slex-input>
  <slex-input id="current" label="电流" type="engineering" value="2" unit="A"></slex-input>
  <slex-stat id="power" label="功率" value="24" unit="W"></slex-stat>
  <button id="reset" type="button">Reset</button>
</slex-card>
<script type="module">
  const voltage = document.querySelector('#voltage');
  const current = document.querySelector('#current');
  const power = document.querySelector('#power');
  const update = () => {
    const result = voltage.valueAsNumber * current.valueAsNumber;
    power.value = Number.isFinite(result) ? result : 'Invalid input';
  };
  const controller = new AbortController();
  voltage.addEventListener('input', update, { signal: controller.signal });
  current.addEventListener('input', update, { signal: controller.signal });
  document.querySelector('#reset').addEventListener('click', () => {
    voltage.value = '12'; current.value = '2'; update();
  }, { signal: controller.signal });
  slex.onDispose(() => controller.abort());
  update();
</script>`;

export const nativeHtmlFixture = `<section><h2>Native HTML and SVG</h2><label>Value <input id="native" value="initial"></label><svg viewBox="0 0 100 30" aria-label="Line"><line x1="0" x2="100" y1="15" y2="15" stroke="currentColor"></line></svg></section>`;

export const htmlLayoutCompatibility = `<slex-card title="跨宿主布局检查">
  <slex-input id="layout-input" label="输入电压" type="engineering" value="12" unit="V"></slex-input>
  <slex-row id="metrics">
    <slex-stat id="metric-voltage" label="输出电压" unit="V"></slex-stat>
    <slex-stat id="metric-current" label="补偿后的实际测量电流与额定参数" value="2.5" unit="A"></slex-stat>
    <slex-stat id="metric-power" label="Calculated output power" unit="W"></slex-stat>
    <slex-stat id="metric-pi" label="圆周率参考值" unit="rad"></slex-stat>
    <slex-stat id="metric-frequency" label="运行频率" unit="Hz"></slex-stat>
  </slex-row>
</slex-card>
<script type="module">
  window.__layoutRuns = (window.__layoutRuns || 0) + 1;
  const input = document.querySelector('#layout-input');
  const update = () => {
    window.__layoutUpdates = (window.__layoutUpdates || 0) + 1;
    document.querySelector('#metric-voltage').value = input.valueAsNumber;
    document.querySelector('#metric-power').value = input.valueAsNumber * 2;
    document.querySelector('#metric-pi').value = Math.PI;
    document.querySelector('#metric-frequency').value = 123456789.123456;
  };
  input.addEventListener('input', update, {signal:slex.signal});
  update();
</script>`;
