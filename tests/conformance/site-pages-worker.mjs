import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Exercise the actual rendered website, including both translated versions of
// every published page. Set SLEXKIT_AUDIT_SCREENSHOTS=1 to retain screenshots.
const base = (process.argv[2] ?? 'http://127.0.0.1:4011').replace(/\/$/, '');
const output = 'test-results/site-page-audit';
await mkdir(output, { recursive: true });
const [wiki, examples] = await Promise.all(['wiki-docs', 'examples-docs'].map(async name => {
  const response = await fetch(`${base}/assets/${name}.json`);
  assert.ok(response.ok, `${name}: ${response.status}`);
  return (await response.json()).markdown;
}));
const plural = { guide: 'guides', reference: 'reference', release: 'releases', component: 'components' };
const routes = [...wiki, ...examples].map(item => ({
  ...item,
  route: `${item.locale === 'zh-CN' ? '/zh-CN' : ''}${item.kind === 'example' ? '/examples' : `/docs/${plural[item.kind]}`}/${item.slug}`,
}));
const browser = await chromium.launch({ headless: true });
const results = [];
const queue = routes.flatMap(item => [
  { ...item, layout: 'desktop', width: 1440, height: 900, colorScheme: 'light' },
  ...(item.locale === 'zh-CN' ? [{ ...item, layout: 'mobile-dark', width: 390, height: 844, colorScheme: 'dark' }] : []),
]);
const worker = async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  let errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text().slice(0, 350)}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url().slice(0, 180)}`);
  });
  while (queue.length) {
    const item = queue.shift();
    errors = [];
    const start = Date.now();
    const result = { route: item.route, layout: item.layout, errors };
    try {
      await page.setViewportSize({ width: item.width, height: item.height });
      await page.emulateMedia({ colorScheme: item.colorScheme, reducedMotion: 'reduce' });
      await page.goto(base + item.route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const article = page.locator(`[data-markdown-doc="${item.slug}"]`);
      await article.locator('h1').first().waitFor();
      await page.waitForTimeout(300);
      result.heading = await article.locator('h1').first().innerText();
      result.frames = await page.locator('iframe.slexkit-html-frame').count();
      if (item.kind === 'component') {
        assert.ok(result.frames > 0, 'component example has no interactive frame');
        const component = page.frameLocator('iframe.slexkit-html-frame').first().locator(`slex-${item.slug}`).first();
        await component.waitFor({ state: 'attached' });
        const upgraded = await component.evaluate(async element => {
          await element.ownerDocument.defaultView.customElements.whenDefined(element.localName);
          const rect = element.getBoundingClientRect();
          return {
            shadow: !!element.shadowRoot,
            top: rect.top,
            bottom: rect.bottom,
            viewportHeight: element.ownerDocument.defaultView.innerHeight,
          };
        });
        assert.ok(upgraded.shadow, 'component did not upgrade');
        assert.ok(upgraded.top >= -1 && upgraded.bottom <= upgraded.viewportHeight + 1,
          `component is clipped by its frame: ${JSON.stringify(upgraded)}`);
      }
      result.overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
      if (result.overflow > 1) errors.push(`page overflows viewport by ${result.overflow}px`);
      if (process.env.SLEXKIT_AUDIT_SCREENSHOTS === '1') {
        await page.screenshot({ path: `${output}/${item.layout}-${item.locale}-${item.kind}-${item.slug}.png`, fullPage: true, animations: 'disabled' });
        const preview = page.locator('.slex-example-shell').first();
        if (await preview.count()) {
          await preview.scrollIntoViewIfNeeded();
          await preview.screenshot({ path: `${output}/preview-${item.layout}-${item.locale}-${item.kind}-${item.slug}.png`, animations: 'disabled' });
        }
      }
    } catch (error) { errors.push(error.message.split('\n')[0]); }
    result.ms = Date.now() - start;
    results.push(result);
    console.log(`${results.length}/${routes.length + routes.filter(item => item.locale === 'zh-CN').length} ${item.layout} ${item.route}: ${errors.length ? errors[0] : 'ok'} (${result.ms}ms)`);
  }
  await context.close();
};
try { await Promise.all([worker(), worker()]); }
finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify({ base, results }, null, 2));
}
const failures = results.filter(result => result.errors.length);
assert.equal(failures.length, 0, `${failures.length} page layouts reported errors; see ${output}/report.json`);
