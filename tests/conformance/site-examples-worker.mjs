import assert from "node:assert/strict";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const base = (process.argv[2] ?? "http://localhost:4199").replace(/\/$/, "");
const browserName = process.env.SLEXKIT_SITE_BROWSER ?? "chromium";
const engine = { chromium, firefox, webkit }[browserName];
if (!engine) throw new Error(`Unknown site browser: ${browserName}`);
const sourceDir = resolve("site/content/examples");
const browser = await engine.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.route("https://jsonplaceholder.typicode.com/**", route => route.fulfill({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ id: 1, title: "Fixture" }),
}));
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const results = [];

async function valueIs(frame, selector, expected) {
  await frame.waitForFunction(
    ({ selector, expected }) => String(document.querySelector(selector)?.value) === String(expected),
    { selector, expected },
    // Offscreen iframe animation frames can be throttled by the browser.
    { timeout: 12000, polling: 100 },
  );
}

async function setRange(frame, selector, value) {
  await frame.locator(`${selector} input[type="range"]`).evaluate((input, value) => {
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }, value);
}

async function choose(frame, selector, index) {
  await frame.locator(`${selector} button`).click();
  await frame.locator(`${selector} [role="option"]`).nth(index).click();
}

async function frameFor(locator) {
  await locator.waitFor({ state: "attached" });
  const handle = await locator.elementHandle();
  const frame = await handle.contentFrame();
  assert.ok(frame, "expected an attached interactive frame");
  await frame.locator("#slex-root > *").first().waitFor({ state: "attached" });
  return frame;
}

async function checkInteraction(slug, locale, frames) {
  const frame = frames[0];
  switch (slug) {
    case "hello-slexkit": {
      const message = locale === "zh-CN" ? "这是标准 HTML fence。" : "This is a standard HTML fence.";
      assert.equal(await frame.locator("slex-text .slex-text").innerText(), message);
      assert.equal(await frame.locator("slex-badge .slex-badge-label").innerText(), "HTML-first");
      assert.equal(await frame.locator("slex-card").evaluate(element => getComputedStyle(element).display), "block");
      break;
    }
    case "first-interaction":
      await valueIs(frame, "#count", 0);
      await frame.locator("#add button").click();
      await valueIs(frame, "#count", 1);
      break;
    case "multi-input-coordination":
      await valueIs(frame, "#result", 30);
      await frame.locator("#left input").fill("5");
      await valueIs(frame, "#result", 25);
      break;
    case "tabs-and-branching":
      await valueIs(frame, "#result", "1.00 m");
      await choose(frame, "#mode", 1);
      await valueIs(frame, "#result", "220.46 lb");
      break;
    case "salary-calculator":
      await valueIs(frame, "#rate", 10.5);
      await valueIs(frame, "#deduction", "1890.00");
      await frame.locator("#salary input").fill("20000");
      await valueIs(frame, "#deduction", "2100.00");
      break;
    case "project-cost-estimator":
      await frame.locator("#hours input").fill("0");
      await valueIs(frame, "#result", "0");
      break;
    case "voltage-divider":
      await valueIs(frame, "#vout", "8.00");
      await frame.locator("#r2 input").fill("10");
      await valueIs(frame, "#vout", "6.00");
      await frame.locator("#r1 input").fill("0");
      await frame.locator("#r2 input").fill("0");
      await valueIs(frame, "#vout", "—");
      break;
    case "rc-low-pass-filter":
      await valueIs(frame, "#cutoff", "159.15");
      await frame.locator("#r input").fill("20k");
      await valueIs(frame, "#cutoff", "79.58");
      break;
    case "baud-rate-calculator":
      await valueIs(frame, "#result", "115385 / 0.16%");
      await frame.locator("#target input").fill("9600");
      await valueIs(frame, "#result", "115385 / 1101.92%");
      await frame.locator("#divider input").fill("0");
      await valueIs(frame, "#result", locale === "zh-CN" ? "请输入有效参数" : "Enter valid parameters");
      break;
    case "search-filter-table":
      await frame.waitForFunction(() => document.querySelector("#results")?.rows?.length === 2);
      await frame.locator("#query input").fill("Lin");
      await frame.waitForFunction(() => document.querySelector("#results")?.rows?.length === 1 && document.querySelector("#results").rows[0].name === "Lin");
      await frame.locator("#details slex-collapsible button").click();
      assert.equal(await frame.locator("#details slex-collapsible button").getAttribute("aria-expanded"), "true");
      await frame.waitForFunction(() => document.querySelector("#details slex-collapsible")?.shadowRoot?.querySelector(".slex-collapsible-content")?.innerText.includes("Designer"));
      break;
    case "project-dashboard":
      await frame.waitForFunction(() => {
        const cards = [...document.querySelector('slex-grid')?.children ?? []];
        const boxes = cards.map(card => card.shadowRoot?.querySelector('.slex-card')?.getBoundingClientRect());
        return cards.length === 3 && boxes.every(Boolean) && boxes[0].right <= boxes[1].left && boxes[1].right <= boxes[2].left && Math.max(...boxes.map(box => box.bottom)) - Math.min(...boxes.map(box => box.bottom)) <= 1;
      }, null, { polling: 100 });
      await valueIs(frame, "#remaining", 3);
      await frame.locator("#resolved input").fill("5");
      await valueIs(frame, "#remaining", 7);
      break;
    case "tech-selection-evaluator":
      await valueIs(frame, "#score", "83.3");
      await setRange(frame, "#performance", 100);
      await valueIs(frame, "#score", "87.8");
      break;
    case "roi-estimator":
      await valueIs(frame, "#buildScore", "40.0");
      await setRange(frame, "#buildFit", 100);
      await valueIs(frame, "#buildScore", "53.3");
      break;
    case "cross-doc-state-lab":
      assert.equal(frames.length, 3, "the shared-state example needs three separate fences");
      await valueIs(frames[2], "#nameValue", "SlexKit");
      await frame.locator("#name input").fill("Shared value");
      await valueIs(frames[2], "#nameValue", "Shared value");
      await frames[1].waitForFunction(() => document.querySelector("#message")?.text === "Shared value", null, { polling: 100 });
      break;
    case "network-policy-fetch-card":
      await frame.locator("#load button").click();
      await frame.waitForFunction(() => document.querySelector("#status")?.text === "200");
      break;
  }
}

async function checkAdapter(slug) {
  const name = slug.replace(/-host$/, "");
  const outer = page.locator(`iframe.slex-example-live-frame[src*="/adapter-demos/${name}/"]`);
  await outer.waitFor({ state: "attached" });
  const parent = await (await outer.elementHandle()).contentFrame();
  assert.ok(parent, `${name} demo frame missing`);
  const nested = await frameFor(parent.locator("iframe.slexkit-html-frame").first());
  if (name === "assistant-ui") {
    await nested.locator("slex-card").waitFor({ state: "attached" });
    assert.ok(await nested.locator("slex-badge .slex-badge-label").innerText());
  } else {
    await valueIs(nested, "#cutoff", "159.15");
    await nested.locator("#r input").fill("20k");
    await valueIs(nested, "#cutoff", "79.58");
  }
}

try {
  const slugs = (await readdir(sourceDir, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  for (const locale of ["en-US", "zh-CN"]) {
    for (const slug of slugs) {
      const path = resolve(sourceDir, slug, `${locale}.md`);
      let markdown;
      try { markdown = await readFile(path, "utf8"); } catch { continue; }
      const fenceCount = [...markdown.matchAll(/^```slex(?:[ \t]+[^\n]*)?\r?\n/gm)].length;
      const marker = errors.length;
      try {
        await page.goto(`${base}${locale === "zh-CN" ? "/zh-CN" : ""}/examples/${slug}`, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.locator("[data-markdown-doc]").waitFor();
        const frames = [];
        if (fenceCount) {
          await page.waitForFunction(count => document.querySelectorAll("iframe.slexkit-html-frame").length >= count, fenceCount, { timeout: 15000 });
          for (let i = 0; i < fenceCount; i++) frames.push(await frameFor(page.locator("iframe.slexkit-html-frame").nth(i)));
          await page.waitForFunction(() => !document.querySelector(".slex-component-preview-inner [role=status]"));
          for (const frame of frames) {
            await frame.waitForFunction(() => [...document.querySelectorAll("#slex-root *")].filter(element => element.localName.startsWith("slex-")).every(element => {
              const shadow = element.shadowRoot;
              return shadow?.querySelector(".slexkit-root") && [...shadow.querySelectorAll('link[rel="stylesheet"]')].every(link => link.sheet);
            }), null, { polling: 100 });
          }
          await checkInteraction(slug, locale, frames);
        } else if (slug === "form-wizard-steps") {
          const demo = page.locator(".slex-toolhost-form-demo");
          await demo.locator('slex-input[data-field-name="name"] input').fill("Example project");
          await demo.getByRole("button", { name: locale === "zh-CN" ? "提交" : "Submit", exact: true }).click();
          await demo.locator("pre").waitFor();
          assert.match(await demo.locator("pre").innerText(), /"status": "submitted"/);
          assert.match(await demo.locator("pre").innerText(), /Example project/);
        } else if (slug === "toolhost-demo") {
          await page.locator(".slex-toolhost-replay slex-submit").waitFor();
        } else throw new Error("Expected an interactive example or ToolHost demo");
        if (["assistant-ui-host", "streamdown-host", "tiptap-host"].includes(slug)) await checkAdapter(slug);
        const alerts = await page.locator(".slex-streamdown-error, .slex-tiptap-diagnostic:not(:empty)").allInnerTexts();
        assert.deepEqual(alerts.filter(Boolean), [], "example displayed a runtime diagnostic");
        assert.deepEqual(errors.slice(marker), [], "example raised a page error");
        results.push({ slug, locale, status: "passed", fences: fenceCount });
        console.log(`${locale}/${slug}: passed`);
      } catch (error) {
        results.push({ slug, locale, status: "failed", error: String(error?.stack ?? error), pageErrors: errors.slice(marker) });
        console.error(`${locale}/${slug}: FAILED: ${String(error?.message ?? error).split("\n")[0]}`);
      }
    }
  }
  for (const scheme of ["light", "dark"]) {
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`${base}/zh-CN/examples/project-dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
      const locator = page.locator("iframe.slexkit-html-frame").first();
      const frame = await frameFor(locator);
      await frame.waitForFunction(() => [...document.querySelectorAll("slex-card")].length === 4 && [...document.querySelectorAll("slex-card")].every(element => element.shadowRoot?.querySelector('link[rel="stylesheet"]')?.sheet), null, { polling: 100 });
      const boxes = await frame.locator("slex-grid > slex-card").evaluateAll(elements => elements.map(element => {
        const { top, bottom } = element.getBoundingClientRect();
        return { top, bottom };
      }));
      assert.equal(boxes.length, 3);
      assert.ok(boxes[0].bottom <= boxes[1].top && boxes[1].bottom <= boxes[2].top, "mobile grid should stack without overlap");
      assert.ok(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "mobile frame overflows horizontally");
      await locator.scrollIntoViewIfNeeded();
      await mkdir(resolve("test-results/site-examples"), { recursive: true });
      await page.screenshot({ path: resolve("test-results/site-examples", `${browserName}-mobile-${scheme}.png`), fullPage: true });
      results.push({ slug: "project-dashboard-mobile", locale: "zh-CN", scheme, status: "passed" });
      console.log(`zh-CN/project-dashboard-mobile/${scheme}: passed`);
    } catch (error) {
      results.push({ slug: "project-dashboard-mobile", locale: "zh-CN", scheme, status: "failed", error: String(error?.stack ?? error) });
      console.error(`zh-CN/project-dashboard-mobile/${scheme}: FAILED: ${String(error?.message ?? error).split("\n")[0]}`);
    }
  }
} finally {
  await mkdir(resolve("test-results/site-examples"), { recursive: true });
  await writeFile(resolve("test-results/site-examples", `${browserName}.json`), JSON.stringify({ base, browser: browserName, results }, null, 2));
  await browser.close();
}
if (results.some(result => result.status !== "passed")) process.exitCode = 1;
