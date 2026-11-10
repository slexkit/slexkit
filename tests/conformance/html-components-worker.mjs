import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { componentGallerySource } from '../../examples/component-gallery/source.js';

const name = process.argv[2] ?? 'chromium';
const output = new URL(`../../test-results/html-migration/${name}/`, import.meta.url);
await mkdir(output, { recursive: true });
const browser = await ({ chromium, firefox, webkit })[name].launch({ headless: true });
const report = { browser: name, version: browser.version(), checks: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto('http://localhost:4197/');
  await page.evaluate(async source => {
    const runtime = await import('/dist/slexkit.js');
    window.gallery = runtime.mount(source, document.querySelector('#root'), {
      secureFrame: { runtimeUrl: location.origin + '/dist/runtime.js', styleUrl: location.origin + '/dist/slexkit.css', fontUrls: [location.origin + '/dist/fonts/'] },
    });
    await window.gallery.ready;
  }, componentGallerySource);
  const frame = page.frameLocator('#root iframe');
  const mounted = await frame.locator('#slex-root').evaluate(root => {
    const elements = [...root.querySelectorAll('*')].filter(node => node.tagName.startsWith('SLEX-'));
    return { tags: [...new Set(elements.map(node => node.localName))], initialized: elements.every(node => !!node.shadowRoot?.querySelector('.slexkit-root')) };
  });
  assert.equal(mounted.tags.length, 28);
  assert.equal(mounted.initialized, true);
  report.tags = mounted.tags;
  report.checks.push('all 28 default elements mounted');
  await frame.locator('#agree input').check();
  assert.equal(await frame.locator('#agree').evaluate(element => element.checked), true);
  await frame.locator('#live label').click();
  assert.equal(await frame.locator('#live').evaluate(element => element.checked), false);
  await frame.locator('#threshold input').fill('64');
  assert.equal(await frame.locator('#threshold').evaluate(element => element.valueAsNumber), 64);
  await frame.locator('#mode input[value="auto"]').check();
  assert.equal(await frame.locator('#mode').evaluate(element => element.value), 'auto');
  report.checks.push('checkbox, switch, slider and radio native interactions');
  await frame.getByRole('tab', { name: 'Details', exact: true }).click();
  await frame.locator('#retained').fill('retained');
  await frame.getByRole('tab', { name: 'Overview', exact: true }).click();
  await frame.getByRole('tab', { name: 'Details', exact: true }).click();
  assert.equal(await frame.locator('#retained').inputValue(), 'retained');
  report.checks.push('named tabs preserve slotted input');
  await frame.locator('#action button').click();
  await frame.getByText('Actions: 1', { exact: true }).waitFor();
  await frame.locator('#submit').getByRole('button', { name: 'Apply', exact: true }).click();
  assert.equal(await frame.locator('#submitted').textContent(), 'Applied');
  assert.match(await frame.locator('#table table').innerText(), /Voltage/);
  assert.equal(await frame.locator('#formula .katex').count(), 1);
  const guest = page.frames().find(item => item.parentFrame() === page.mainFrame());
  await guest.waitForFunction(() => document.fonts.size > 0);
  assert.deepEqual(await guest.evaluate(async () => (await document.fonts.load('16px KaTeX_Main', 'A')).map(font => font.status)), ['loaded']);
  report.checks.push('button events, submit, table arrays and formula');
  await page.screenshot({ path: fileURLToPath(new URL('components.png', output)), fullPage: true });
  await page.evaluate(() => window.gallery());
  await page.waitForFunction(() => !document.querySelector('#root iframe'));
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) { report.passed = false; report.error = error.stack; process.exitCode = 1; console.error(error); }
finally { await writeFile(new URL('components-report.json', output), JSON.stringify(report, null, 2)); await browser.close(); }
