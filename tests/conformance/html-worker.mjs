import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";
import { htmlCalculator, nativeHtmlFixture } from "./html-fixtures.ts";

const name = process.argv[2] ?? "chromium";
const engine = { chromium, firefox, webkit }[name];
if (!engine) throw new Error(`Unknown browser ${name}`);
const output = new URL(`../../test-results/html-migration/${name}/`, import.meta.url);
await mkdir(output, { recursive: true });
const browserServer = await engine.launchServer({ headless: true });
console.log(JSON.stringify({ browserPid: browserServer.process().pid, name }));
const watchdog = setTimeout(() => { browserServer.process().kill(); process.exitCode = 1; }, 60_000);
const browser = await engine.connect(browserServer.wsEndpoint());
const report = { name, browserVersion: browser.version(), checks: [], errors: [], console: [], requests: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 850 } });
  page.setDefaultTimeout(12_000);
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) report.console.push(message.text()); });
  page.on("request", (request) => report.requests.push(request.url()));
  await page.goto("http://localhost:4197/");
  const description = await page.evaluate(async (source) => {
    const runtime = await import("/dist/slexkit.js");
    window.runtime = runtime;
    window.handle = runtime.mount(source, document.querySelector("#root"), {
      secureFrame: { runtimeUrl: new URL("/dist/slexkit.js", location.href).href, styleUrl: new URL("/dist/slexkit.css", location.href).href },
    });
    await window.handle.ready;
    return { components: runtime.describeSlexElements().length, exports: Object.keys(runtime) };
  }, htmlCalculator);
  assert.equal(description.components, 28);
  report.checks.push("opaque iframe bootstrap and registered components");
  const frame = page.frameLocator("#root iframe");
  const voltage = frame.locator("#voltage input");
  await voltage.fill("2.2k");
  assert.equal(await frame.locator("#power").evaluate((element) => element.value), 4400);
  await voltage.fill("invalid");
  assert.equal(await frame.locator("#power").evaluate((element) => element.value), "Invalid input");
  await frame.locator("#reset").click();
  assert.equal(await voltage.inputValue(), "12");
  report.checks.push("engineering input, derived result, invalid input, reset action");
  await voltage.fill("37");
  await voltage.focus();
  await voltage.evaluate((input) => input.setSelectionRange(1, 2));
  await page.evaluate(async (source) => { await window.handle.update(source); }, htmlCalculator.replace('title="功率计算器"', 'title="Updated"').replace('value="12"', 'value="24"'));
  assert.equal(await voltage.inputValue(), "37");
  report.checks.push("changed default preserves modified input");
  const dom = await voltage.evaluate((input) => ({ focus: input.getRootNode().activeElement === input, selection: [input.selectionStart, input.selectionEnd] }));
  assert.deepEqual(dom, { focus: true, selection: [1, 2] });
  report.checks.push("focus and selection preservation");
  await page.evaluate(async () => { await window.handle.reset(); });
  assert.equal(await voltage.inputValue(), "24");
  assert.equal(await frame.locator("#power").evaluate((element) => element.value), 48);
  report.checks.push("explicit reset applies latest defaults");
  await page.screenshot({ path: fileURLToPath(new URL("calculator.png", output)), fullPage: true });
  const isolation = await page.evaluate(() => {
    const iframe = document.querySelector("#root iframe");
    return { sandbox: iframe.getAttribute("sandbox") };
  });
  assert.equal(isolation.sandbox, "allow-scripts");
  // Reading contentDocument itself emits a WebKit security diagnostic. Verify
  // the effective opaque origin from within the frame without probing parent DOM.
  assert.equal(await frame.locator("body").evaluate(() => globalThis.origin), "null");
  report.checks.push("parent DOM isolation");
  await page.evaluate(async (source) => { await window.handle.update(source); }, nativeHtmlFixture);
  await frame.locator("#native").fill("persisted");
  await page.evaluate(async (source) => { await window.handle.update(source); }, nativeHtmlFixture.replace("Native HTML and SVG", "Updated native content"));
  assert.equal(await frame.locator("#native").inputValue(), "persisted");
  report.checks.push("native HTML/SVG and input updates");
  await page.evaluate(() => { window.handle(); });
  await page.locator("#root iframe").waitFor({ state: "detached" });
  assert.equal(await page.locator("iframe").count(), 0);
  report.checks.push("frame disposal");
  const foreign = await page.evaluate(async (source) => {
    const outer = document.createElement("iframe");
    const loaded = new Promise(resolve => { outer.onload = resolve; });
    outer.srcdoc = "<!doctype html><body><main id=foreign></main></body>";
    document.querySelector("#other").append(outer);
    await loaded;
    const target = outer.contentDocument.querySelector("main");
    const handle = window.runtime.mount(source, target, { secureFrame: { runtimeUrl: new URL("/dist/slexkit.js", location.href).href, styleUrl: new URL("/dist/slexkit.css", location.href).href } });
    await handle.ready;
    const snapshot = await handle.snapshot();
    handle();
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = { snapshot: !!snapshot, released: target.querySelectorAll("iframe").length === 0 };
    outer.remove();
    return result;
  }, nativeHtmlFixture);
  assert.deepEqual(foreign, { snapshot: true, released: true });
  report.checks.push("foreign owner document and snapshot/disposal");
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log(`${name}: ${report.checks.length} HTML host checks passed`);
} catch (error) {
  report.passed = false;
  report.error = error.stack;
  process.exitCode = 1;
  console.error(error);
} finally {
  clearTimeout(watchdog);
  await writeFile(new URL("report.json", output), JSON.stringify(report, null, 2));
  await browser.close();
  await browserServer.close();
}
