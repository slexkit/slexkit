import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";
import { verifyAdapterLayout } from "./adapter-layout-checks.mjs";

const name = process.argv[2] ?? "chromium";
const url = process.argv[3] ?? "http://127.0.0.1:3133";
const engine = { chromium, firefox, webkit, chrome: chromium, edge: chromium }[name];
const output = new URL(`../../test-results/html-migration/${name}/`, import.meta.url);
await mkdir(output, { recursive: true });
const browser = await engine.launch({ headless: true, ...(name === "chrome" ? { channel: "chrome" } : name === "edge" ? { channel: "msedge" } : {}) });
const watchdog = setTimeout(() => { process.exitCode = 1; void browser.close(); }, 120_000);
const report = { browser: name, version: browser.version(), startedAt: new Date().toISOString(), routes: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 850 } });
  page.setDefaultTimeout(12_000);
  await page.goto(url);
  await page.waitForFunction(() => !!window.harness);
  for (const route of ["web", "streamdown", "assistant-ui", "tiptap", "playground"]) {
    const result = { route, checks: [] };
    try {
      await page.evaluate((name) => window.harness.start(name), route);
      const frame = page.frameLocator("#app iframe");
      const input = frame.locator("#voltage input");
      await input.fill("2k");
      assert.equal(await frame.locator("#power").evaluate(element => element.value), 4000);
      result.checks.push("identical source calculation");
      const revised = await page.evaluate(() => window.harness.source.replace('title="功率计算器"', 'title="Updated"').replace('value="12"', 'value="24"'));
      await input.fill("37");
      await page.evaluate((source) => window.harness.update(source), revised);
      assert.equal(await input.inputValue(), "37");
      result.checks.push("input preservation on source update");
      if (route !== "playground") {
        const invalid = revised + '<script>const = 1</script>';
        await page.evaluate((source) => window.harness.update(source), invalid).catch(() => {});
        assert.equal(await input.inputValue(), "37");
        result.checks.push("invalid update keeps last commit");
        await page.evaluate((source) => window.harness.update(source), revised);
        await page.evaluate(() => window.harness.reset());
        await page.waitForFunction(() => document.querySelector("#app iframe"));
        assert.equal(await input.inputValue(), "24");
        result.checks.push("explicit reset");
      }
      if (route === "tiptap") assert.match(await page.locator(".tiptap").textContent(), /Ordinary Markdown/);
      await page.screenshot({ path: fileURLToPath(new URL(`${route}.png`, output)), fullPage: true });
      await page.evaluate(() => window.harness.dispose());
      await page.waitForFunction(() => !document.querySelector("#app iframe"));
      result.checks.push("dispose");
      result.layout = await verifyAdapterLayout(page, route, name, output);
      result.passed = true;
    } catch (error) { result.passed = false; result.error = error.stack; }
    report.routes.push(result);
    console.log(`${name} ${route}: ${result.passed ? "passed" : result.error}`);
  }
  await page.goto(`${url}/fallback`);
  assert.equal(await page.locator("iframe").count(), 0);
  assert.match(await page.locator("code.language-slex").textContent(), /slex-input/);
  assert.match(await page.locator("body").textContent(), /Readable result: 24 W/);
  report.ordinaryMarkdownFallback = true;
  if (report.routes.some(route => !route.passed)) process.exitCode = 1;
} catch (error) { report.error = error.stack; process.exitCode = 1; console.error(error); }
finally {
  clearTimeout(watchdog);
  await writeFile(new URL("adapters-report.json", output), JSON.stringify(report, null, 2));
  await browser.close();
}
