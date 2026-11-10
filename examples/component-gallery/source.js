export const componentGallerySource = `<slex-column>
  <slex-section title="Component gallery" subtitle="Standard HTML and native JavaScript">
    <slex-card title="Controls">
      <slex-grid columns="2" gap="16">
        <slex-input id="name" label="Project" value="SlexKit"></slex-input>
        <slex-slider id="threshold" label="Threshold" min="0" max="100" value="42" unit="%"></slex-slider>
        <slex-checkbox id="agree" label="I agree"></slex-checkbox>
        <slex-switch id="live" label="Live updates" checked></slex-switch>
        <slex-select id="color" label="Color" value="blue"><option value="blue">Blue</option><option value="red">Red</option></slex-select>
        <slex-radio-group id="mode" label="Mode" value="manual"><option value="manual">Manual</option><option value="auto">Automatic</option></slex-radio-group>
      </slex-grid>
      <slex-button id="action">Count action</slex-button>
      <slex-text id="count">Actions: 0</slex-text>
    </slex-card>
    <slex-card title="Display">
      <slex-row><slex-badge>Ready</slex-badge><slex-progress label="Build" value="68"></slex-progress></slex-row>
      <slex-stat label="Requests" value="128"></slex-stat>
      <slex-divider label="Content"></slex-divider>
      <slex-callout title="Native content" tone="info"><p>HTML and SVG work inside component slots.</p></slex-callout>
      <slex-code-block language="js">const watts = volts * amps;</slex-code-block>
      <slex-formula id="formula">P = V I</slex-formula>
      <slex-link href="#details">Jump to details</slex-link>
      <slex-table id="table"></slex-table>
    </slex-card>
    <slex-tabs id="tabs" value="overview">
      <section slot="overview" aria-label="Overview"><p>Overview content</p></section>
      <section slot="details" aria-label="Details"><label>Retained input <input id="retained" value="seed"></label></section>
    </slex-tabs>
    <slex-accordion id="accordion"><section slot="explanation" aria-label="Explanation"><p>Accordion content</p></section></slex-accordion>
    <slex-collapsible trigger="More information"><p>Collapsible content</p></slex-collapsible>
    <slex-step title="Review" index="1" total="2"><p>Check the values before submitting.</p></slex-step>
    <slex-toast title="Preview ready" description="No remote services are involved." duration="0"></slex-toast>
    <slex-submit id="submit" submit-label="Apply" ignore-label="Skip"></slex-submit>
    <output id="submitted" aria-live="polite">Pending</output>
  </slex-section>
</slex-column>
<script type="module">
  const table = document.querySelector('#table');
  table.columns = [{key:'name', label:'Name'}, {key:'value', label:'Value'}];
  table.rows = [{name:'Voltage', value:'12 V'}, {name:'Current', value:'2 A'}];
  let count = 0;
  document.querySelector('#action').addEventListener('click', () => {
    document.querySelector('#count').textContent = 'Actions: ' + (++count);
  }, {signal:slex.signal});
  document.querySelector('#submit').addEventListener('submit', () => {
    document.querySelector('#submitted').textContent = 'Applied';
  }, {signal:slex.signal});
</script>`;
