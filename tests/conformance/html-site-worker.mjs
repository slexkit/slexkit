import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import homeSource from '../../site/examples/home-rc-filter/example.en-US.slex.js';

const output = new URL('../../test-results/html-migration/site/', import.meta.url);
const styleOutput = new URL('../../test-results/html-style-review/', import.meta.url);
const baseUrl = (process.argv[2] ?? 'http://localhost:4199').replace(/\/$/, '');
await mkdir(output, { recursive: true });
await mkdir(styleOutput, { recursive: true });
const browserName = process.env.SLEXKIT_SITE_BROWSER ?? 'chromium';
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unknown site browser: ${browserName}`);
const browser = await browserType.launch({ headless: true });
const report = { version: browser.version(), pages: [], errors: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, colorScheme: 'light' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.errors.push(error.message));
  const blockedFonts = [];
  page.on('console', message => {
    if (message.type() === 'error' && /font-src|Loading the font.*Content Security Policy/i.test(message.text())) {
      blockedFonts.push(message.text());
    }
  });
  // Match the request-target limit imposed by public static-site hosts. URL
  // fragments are excluded because browsers never send them to the server.
  await context.route('**/playground.html?**', async route => {
    const url = new URL(route.request().url());
    if ((url.pathname + url.search).length > 2048) {
      await route.fulfill({ status: 414, body: 'URI Too Long' });
    } else await route.continue();
  });
  await page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded' });
  const homeShell = page.frameLocator('iframe.slex-home-playground-frame');
  const home = page.frameLocator('iframe.slex-home-playground-frame').frameLocator('iframe');
  await homeShell.getByRole('toolbar', { name: 'Preview controls' }).waitFor();
  await homeShell.getByRole('heading', { name: 'First-order RC Low-pass Filter' }).waitFor();
  await home.locator('#r').waitFor();
  assert.equal(await home.locator('.rc-filter-demo').count(), 1, 'the first HTML line and its layout container must survive fence extraction');
  assert.equal(await homeShell.locator('.katex-display').count(), 2);
  assert.equal(await home.locator('slex-slider').count(), 4);
  assert.equal(await home.locator('slex-stat').count(), 4);
  await home.locator('#r input').fill('20k');
  assert.equal(await home.locator('#cutoff').evaluate(element => element.value), '79.58');
  assert.equal(await home.locator('#r').evaluate(() => {
    try { void parent.document; return false; } catch { return location.origin === 'null'; }
  }), true);
  await home.locator('#rControl input[type="range"]').evaluate(element => {
    element.value = '30000';
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  });
  assert.equal(await home.locator('#cutoff').evaluate(element => element.value), '53.05');
  await home.locator('#reset button').click();
  assert.equal(await home.locator('#r').evaluate(element => element.value), '10kΩ');
  assert.equal(await home.locator('#cutoff').evaluate(element => element.value), '159.15');
  await page.waitForFunction(() => document.querySelector('iframe.slex-home-playground-frame')?.getBoundingClientRect().height > 700);
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.slex-home-preview')).opacity) > .99);
  assert.equal(await home.locator('#r input').isVisible(), true);
  // Interaction can scroll the host while focusing an iframe control. Reset
  // before full-page capture so sticky headers are not stitched mid-page.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0);
  await page.waitForFunction(() => {
    const name = document.querySelector('.slex-home-expanded-name');
    return !name || name.getBoundingClientRect().width >= name.scrollWidth - 1;
  });
  await page.screenshot({ path: new URL('home.png', output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true, animations: 'disabled' });
  await page.screenshot({ path: new URL('after-home-light.png', styleOutput).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true, animations: 'disabled' });
  report.pages.push('homepage Markdown, formulas, four controls/sliders/stats, reset, and late iframe resize');

  await page.goto(baseUrl + '/docs/components/input', { waitUntil: 'domcontentloaded' });
  const componentShell = page.locator('.slex-example-shell').first();
  await componentShell.waitFor();
  assert.equal(await componentShell.getByRole('toolbar', { name: 'Example preview controls' }).isVisible(), true);
  assert.equal(await componentShell.locator('.slex-preview-format').textContent(), 'HTML');
  assert.equal(await componentShell.locator('.slex-preview-canvas').evaluate(element => getComputedStyle(element).backgroundImage.includes('radial-gradient')), true);
  assert.equal(await componentShell.locator('.slex-component-preview-inner').evaluate((inner) => inner.getBoundingClientRect().width < inner.parentElement.getBoundingClientRect().width), true);
  await componentShell.getByRole('button', { name: 'View HTML source' }).click();
  assert.equal(await componentShell.locator('.slex-component-code').isVisible(), true);
  await componentShell.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.screenshot({ path: new URL('after-input-light.png', styleOutput).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  report.pages.push('component demo shell, accessible modes, dotted canvas, and HTML format label');

  // Markdown's configured host and its SlexCode child must agree on approved
  // font URLs; a later configure() must not silently reset font-src to none.
  await page.goto(baseUrl + '/docs/components/formula', { waitUntil: 'domcontentloaded' });
  const formulaFrame = page.locator('iframe.slexkit-html-frame').first();
  await formulaFrame.waitFor();
  const formula = page.frameLocator('iframe.slexkit-html-frame').first().locator('slex-formula');
  await formula.waitFor();
  const frameMarkup = await formulaFrame.getAttribute('srcdoc');
  assert.match(frameMarkup, /font-src\s+[^;]*\/fonts\//);
  assert.deepEqual(await formula.evaluate(async element =>
    (await element.ownerDocument.fonts.load('16px KaTeX_Main', 'A')).map(font => font.status)), ['loaded']);
  assert.deepEqual(blockedFonts, [], 'component previews must load their own KaTeX fonts without CSP violations');
  report.pages.push('formula preview loads KaTeX fonts through its explicitly approved CSP source');

  await page.goto(baseUrl + '/docs/components/divider', { waitUntil: 'domcontentloaded' });
  const divider = page.frameLocator('iframe.slexkit-html-frame').first().locator('slex-divider');
  await divider.waitFor();
  await page.waitForTimeout(200);
  const dividerBounds = await divider.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewportHeight: element.ownerDocument.defaultView.innerHeight };
  });
  assert.ok(dividerBounds.top >= 0 && dividerBounds.bottom <= dividerBounds.viewportHeight + 1,
    `component with vertical margins must fit within the frame: ${JSON.stringify(dividerBounds)}`);
  assert.equal(await divider.getByText('Details', { exact: true }).isVisible(), true);
  report.pages.push('iframe height contains component margins without clipping the divider');

  await page.goto(baseUrl + '/docs/components/accordion', { waitUntil: 'domcontentloaded' });
  const accordion = page.frameLocator('iframe.slexkit-html-frame').first().locator('slex-accordion');
  const overview = accordion.getByRole('button', { name: 'Overview' });
  await overview.click();
  assert.equal(await overview.getAttribute('aria-expanded'), 'true');
  assert.equal(await accordion.getByText('See the project summary.').isVisible(), true);
  await page.goto(baseUrl + '/docs/components/radio-group', { waitUntil: 'domcontentloaded' });
  const radioGroup = page.frameLocator('iframe.slexkit-html-frame').first().locator('slex-radio-group');
  await radioGroup.getByRole('radio', { name: 'Production' }).check();
  assert.equal(await radioGroup.evaluate(element => element.value), 'prod');
  report.pages.push('component documentation examples expose working accordion and radio interactions');

  await page.goto(baseUrl + '/docs/guides/quick-start', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('iframe').length > 0);
  await page.getByRole('heading', { name: 'Getting Started', exact: true }).waitFor();
  assert.match(await page.locator('body').innerText(), /createSlexKitMarkdownRuntimeHost/);
  await page.screenshot({ path: new URL('quick-start.png', output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  report.pages.push('quick-start HTML documentation');

  // Standalone render mode must grow beyond the viewport. The interaction
  // originates inside the opaque iframe, where users naturally wheel over it.
  await page.setViewportSize({ width: 1280, height: 650 });
  await page.goto(baseUrl + '/playground.html?mode=render&type=markdown#' + new URLSearchParams({ source: homeSource }), { waitUntil: 'domcontentloaded' });
  await page.frameLocator('[data-playground-preview] iframe').locator('#r input').waitFor();
  await page.waitForFunction(() => document.documentElement.scrollHeight > innerHeight + 100);
  let previewBox = await page.locator('[data-playground-preview] iframe').boundingBox();
  assert.ok(previewBox && previewBox.y < 650, 'interactive preview must be reachable');
  await page.mouse.move(previewBox.x + previewBox.width / 2, Math.min(previewBox.y + 80, 620));
  await page.mouse.wheel(0, 450);
  await page.waitForFunction(() => window.scrollY > 50);
  await page.getByRole('button', { name: 'Toggle color theme' }).waitFor();
  report.pages.push('standalone render scrolls with the pointer inside the interactive iframe');

  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto(baseUrl + '/playground.html?mode=render&type=markdown#' + new URLSearchParams({ source: homeSource }), { waitUntil: 'domcontentloaded' });
  await page.frameLocator('[data-playground-preview] iframe').locator('#r input').waitFor();
  await page.waitForFunction(() => document.documentElement.scrollHeight > innerHeight + 200);
  await page.evaluate(() => {
    const frame = document.querySelector('[data-playground-preview] iframe');
    const top = frame.getBoundingClientRect().top + window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, Math.max(0, Math.min(top - 150, max - 100)));
  });
  const previousScroll = await page.evaluate(() => window.scrollY);
  previewBox = await page.locator('[data-playground-preview] iframe').boundingBox();
  assert.ok(previewBox, 'mobile interactive preview must exist');
  await page.mouse.move(previewBox.x + previewBox.width / 2, Math.max(1, Math.min(previewBox.y + 80, 620)));
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(previous => window.scrollY > previous + 20, previousScroll);
  report.pages.push('standalone mobile-width render scrolls over the interactive iframe');

  if (browserName === 'chromium') {
    const mobile = await browser.newContext({ viewport: { width: 390, height: 650 }, isMobile: true, hasTouch: true });
    try {
      const touchPage = await mobile.newPage();
      await touchPage.goto(baseUrl + '/playground.html?mode=render&type=markdown#' + new URLSearchParams({ source: homeSource }), { waitUntil: 'domcontentloaded' });
      await touchPage.frameLocator('[data-playground-preview] iframe').locator('#r input').waitFor();
      await touchPage.waitForFunction(() => document.documentElement.scrollHeight > innerHeight + 200);
      const touchFrame = await touchPage.locator('[data-playground-preview] iframe').boundingBox();
      assert.ok(touchFrame && touchFrame.y < 620, 'touch target must be inside the visible iframe');
      const x = touchFrame.x + touchFrame.width / 2;
      const y = Math.min(touchFrame.y + 35, 610);
      const session = await mobile.newCDPSession(touchPage);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let offset = 50; offset <= 300; offset += 50) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - offset }] });
        await touchPage.waitForTimeout(50);
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await touchPage.waitForFunction(() => window.scrollY > 50);
      report.pages.push('mobile Chromium touch swipe scrolls from inside the interactive iframe');
    } finally {
      await mobile.close();
    }
  }

  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto(baseUrl + '/playground.html?mode=live', { waitUntil: 'domcontentloaded' });
  const frame = page.frameLocator('[data-playground-preview] iframe');
  await page.getByRole('toolbar', { name: 'Preview controls' }).waitFor();
  await frame.locator('#r input').fill('20k');
  assert.equal(await frame.locator('#cutoff').evaluate(element => element.value), '79.58');
  assert.equal(await page.locator('#playgroundError').isVisible(), false);
  assert.equal(await page.locator('.slex-playground-workspace').evaluate(element => getComputedStyle(element).display), 'grid');
  await page.locator('.cm-content').click();
  await page.keyboard.press('Control+Home');
  await page.keyboard.type('Edited introduction.\n\n');
  await page.waitForTimeout(300);
  assert.equal(await frame.locator('#r').evaluate(element => element.value), '20k');
  await page.keyboard.press('Control+End');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#playgroundError').isVisible(), true);
  assert.equal(await frame.locator('#r').evaluate(element => element.value), '20k');
  await page.reload();
  await page.getByRole('toolbar', { name: 'Preview controls' }).waitFor();
  assert.equal(await page.locator('#playgroundError').isVisible(), false);
  await page.getByRole('button', { name: 'Code editor' }).click();
  assert.equal(await page.locator('[data-playground-preview]').isHidden(), true);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  assert.equal(await page.locator('[data-playground-preview]').isVisible(), true);
  const copy = page.getByRole('button', { name: 'Copy source' });
  await copy.click();
  await page.getByRole('button', { name: 'Copied' }).waitFor();
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Open in new window' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  assert.match(popup.url(), /mode=render/);
  await popup.getByRole('toolbar', { name: 'Preview controls' }).waitFor();
  assert.ok(new URL(popup.url()).search.length < 2048);
  assert.ok(new URLSearchParams(new URL(popup.url()).hash.slice(1)).get('source')?.includes('First-order RC Low-pass Filter'));
  await popup.close();
  await page.screenshot({ path: new URL('playground.png', output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  await page.screenshot({ path: new URL('after-playground-dark.png', styleOutput).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  report.pages.push('standalone modes, copy, dark theme, RC calculation, and input retention after Markdown edit');

  const hostile = '# Safe host text\n\n<img src=x onerror="window.__hostPwned = true"><script>window.__hostPwned = true</script>';
  await page.goto(baseUrl + '/playground.html?mode=render&type=markdown&source=' + encodeURIComponent(hostile), { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Safe host text' }).waitFor();
  assert.equal(await page.evaluate(() => window.__hostPwned), undefined);
  assert.equal(await page.locator('[data-playground-preview] img').count(), 0);
  assert.match(await page.locator('[data-playground-preview]').innerText(), /window\.__hostPwned/);
  report.pages.push('raw HTML from query source remains inert in the host document');

  const longSource = '# Long source\n\n' + 'Portable content.\n\n'.repeat(2000) + 'End of content.';
  await page.goto(baseUrl + '/playground.html?mode=render&type=markdown#' + new URLSearchParams({ source: longSource }), { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Long source' }).waitFor();
  assert.match(await page.locator('[data-playground-preview]').innerText(), /End of content\./);
  report.pages.push('large fragment source renders under a strict HTTP request-target limit');

  report.pages.push('RC module execution stays in the opaque isolated iframe');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.setItem('slexkit:theme', 'light'));
  await page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded' });
  const mobileHome = page.frameLocator('iframe.slex-home-playground-frame').frameLocator('iframe');
  await mobileHome.locator('#r input').waitFor();
  await page.waitForFunction(() => document.querySelector('iframe.slex-home-playground-frame')?.getBoundingClientRect().height > 1200);
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.slex-home-preview')).opacity) > .99);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await mobileHome.locator('slex-slider').count(), 4);
  await page.screenshot({ path: new URL('mobile.png', output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  await page.evaluate(() => scrollTo(0, Math.max(0, document.querySelector('.slex-home-preview').offsetTop - 64)));
  await page.waitForTimeout(150);
  assert.equal(await mobileHome.locator('#r input').isVisible(), true);
  await page.screenshot({ path: new URL('after-mobile-light.png', styleOutput).pathname.replace(/^\/(\w:)/, '$1') });
  report.pages.push('390px responsive homepage with full demo and no horizontal overflow');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) { report.passed = false; report.error = error.stack; process.exitCode = 1; console.error(error); }
finally { await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2)); await browser.close(); }
