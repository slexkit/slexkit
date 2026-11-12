import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

// Pass an independently installed consumer directory, not the repository.
const consumer = process.argv[2];
assert.ok(consumer, 'Usage: node tests/conformance/installed-runtime-worker.mjs <consumer directory>');
const pkgRoot = resolve(consumer, 'node_modules/slexkit');
const metadata = JSON.parse(await readFile(resolve(pkgRoot, 'package.json'), 'utf8'));
const expectedVersion = process.env.SLEXKIT_EXPECTED_VERSION;
if (expectedVersion) assert.equal(metadata.version, expectedVersion);
const distRoot = resolve(pkgRoot, 'dist');
const html = `<!doctype html><meta charset="utf-8"><div id="margin"></div><div id="formula"></div><div id="field"></div>
<script type="module">
import { mount } from '/dist/slexkit.js';
const options = { secureFrame: { runtimeUrl: location.origin + '/dist/runtime.js', styleUrl: location.origin + '/dist/slexkit.css', fontUrls: [location.origin + '/dist/fonts/'] } };
window.margin = mount('<slex-divider label="Details"></slex-divider>', document.querySelector('#margin'), options);
window.formula = mount('<slex-formula tex="E = mc^2"></slex-formula>', document.querySelector('#formula'), options);
window.field = mount('<slex-input label="Value" value="initial"></slex-input>', document.querySelector('#field'), options);
Promise.all([margin.ready, formula.ready, field.ready]).then(() => window.ready = true).catch(e => window.failure = String(e));
</script>`;
const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html); return; }
    const filename = resolve(pkgRoot, `.${decodeURIComponent(path)}`);
    if (!filename.startsWith(distRoot + sep)) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', filename.endsWith('.js') ? 'text/javascript' : filename.endsWith('.css') ? 'text/css' : filename.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream');
    response.end(await readFile(filename));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(base);
      await page.waitForFunction(() => window.ready || window.failure);
      assert.equal(await page.evaluate(() => window.failure), undefined);
      const divider = page.frameLocator('#margin iframe').locator('slex-divider');
      await divider.getByText('Details').waitFor();
      const bounds = await divider.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: element.ownerDocument.defaultView.innerHeight };
      });
      assert.ok(bounds.top >= 0 && bounds.bottom <= bounds.height + 1, `${name} clipped divider: ${JSON.stringify(bounds)}`);
      const formula = page.frameLocator('#formula iframe').locator('slex-formula');
      await formula.waitFor();
      assert.deepEqual(await formula.evaluate(async element => (await element.ownerDocument.fonts.load('16px KaTeX_Main', 'A')).map(font => font.status)), ['loaded']);
      const field = page.frameLocator('#field iframe').locator('slex-input input');
      await field.fill('changed');
      await page.evaluate(() => window.field.update('<slex-input label="Value" value="new default"></slex-input>'));
      assert.equal(await field.inputValue(), 'changed');
      await page.evaluate(() => Promise.all([window.margin(), window.formula(), window.field()]));
      await page.waitForFunction(() => document.querySelectorAll('iframe').length === 0);
      assert.deepEqual(errors, []);
      console.log(`${name}: installed slexkit@${metadata.version}, frame margins, fonts, state and disposal passed`);
    } finally { await browser.close(); }
  }
} finally { await new Promise(resolveClose => server.close(resolveClose)); }
