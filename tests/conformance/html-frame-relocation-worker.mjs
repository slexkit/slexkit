import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
import { htmlCalculator } from "./html-fixtures.ts";

const relocationCalculator = htmlCalculator
  .replace(
    "  const update = () => {\n    const result",
    "  let hiddenValue = voltage.value;\n  delete document.documentElement.dataset.relocationRestore;\n  const update = () => {\n    hiddenValue = voltage.value;\n    const result",
  )
  .replace(
    "  slex.onDispose(() => controller.abort());",
    "  slex.onSnapshot(() => ({ hiddenValue }));\n  slex.onRestore((state) => { hiddenValue = state?.hiddenValue ?? ''; document.documentElement.dataset.relocationRestore = hiddenValue; });\n  slex.onDispose(() => controller.abort());",
  );

const name = process.argv[2] ?? "chromium";
const engine = { chromium, firefox, webkit }[name];
if (!engine) throw new Error(`Unknown browser ${name}`);
const output = new URL("../../test-results/html-frame-relocation/", import.meta.url);
await mkdir(output, { recursive: true });
const progress = async (step) => writeFile(new URL(`${name}.progress.txt`, output), `${step}\n`);
await progress("launching browser");
const browser = await engine.launch({ headless: true });
console.log(JSON.stringify({ name }));
const watchdog = setTimeout(() => {
  void browser.close();
  process.exitCode = 1;
}, 90_000);
await progress("browser connected");
const report = { browser: name, version: browser.version(), checks: [], errors: [], console: [] };

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) report.console.push(message.text());
  });
  await page.goto("http://localhost:4197/");
  await progress("host page loaded");
  await page.evaluate(async (source) => {
    const original = {
      add: window.addEventListener,
      remove: window.removeEventListener,
      observer: window.MutationObserver,
      matchMedia: window.matchMedia,
    };
    const listeners = new Set();
    const observers = new Map();
    const media = new Set();
    window.addEventListener = function (type, listener, ...args) {
      if (type === "message") listeners.add(listener);
      return original.add.call(this, type, listener, ...args);
    };
    window.removeEventListener = function (type, listener, ...args) {
      if (type === "message") listeners.delete(listener);
      return original.remove.call(this, type, listener, ...args);
    };
    window.MutationObserver = class extends original.observer {
      observe(...args) {
        const stack = new Error("MutationObserver created").stack ?? "";
        if (!stack.includes("InjectedScript") && !observers.has(this)) observers.set(this, stack);
        return super.observe(...args);
      }
      disconnect() {
        observers.delete(this);
        return super.disconnect();
      }
    };
    window.matchMedia = function (query) {
      const result = original.matchMedia.call(this, query);
      const add = result.addEventListener.bind(result);
      const remove = result.removeEventListener.bind(result);
      const active = new Set();
      result.addEventListener = (type, listener, ...args) => {
        if (type === "change") {
          active.add(listener);
          media.add(active);
        }
        return add(type, listener, ...args);
      };
      result.removeEventListener = (type, listener, ...args) => {
        if (type === "change") {
          active.delete(listener);
          if (!active.size) media.delete(active);
        }
        return remove(type, listener, ...args);
      };
      return result;
    };
    window.resourceSnapshot = () => ({
      messageListeners: listeners.size,
      themeObservers: observers.size,
      mediaSubscriptions: media.size,
      iframes: document.querySelectorAll("iframe.slexkit-html-frame").length,
    });
    window.runtime = await import("/dist/slexkit.js");
    window.resourceBaseline = window.resourceSnapshot();
    window.host = window.runtime.createSlexKitMarkdownRuntimeHost({
      secureFrame: {
        runtimeUrl: new URL("/dist/slexkit.js", location.href).href,
        styleUrl: false,
        teardownTimeoutMs: 250,
      },
    });
    const left = document.createElement("section");
    const right = document.createElement("section");
    left.id = "left";
    right.id = "right";
    const slot = document.createElement("div");
    slot.id = "slot-0";
    left.append(slot);
    document.querySelector("#root").replaceChildren(left, right);
    window.slot = slot;
    window.source = source;
    await window.host.updateArtifact(
      "relocation",
      [{ artifactId: "relocation", blockId: "calculator", source, container: slot }],
      { phase: "commit", reset: false },
    );
  }, relocationCalculator);
  await progress("artifact mounted");

  const activeFrame = () => page.frameLocator("iframe.slexkit-html-frame");
  const assertCalculator = async (value, power) => {
    await activeFrame().locator("#voltage input").waitFor();
    assert.equal(await activeFrame().locator("#voltage input").inputValue(), value);
    assert.equal(
      await activeFrame()
        .locator("#power")
        .evaluate((element) => element.value),
      power,
    );
    assert.equal(await page.locator("iframe.slexkit-html-frame").count(), 1);
  };
  await activeFrame().locator("#voltage input").fill("37");
  await assertCalculator("37", 74);
  await page.waitForTimeout(0);
  report.checks.push("edited visible control checkpointed at 37 with derived value 74");
  await progress("initial edit verified");

  await page.evaluate(() => document.querySelector("#right").append(window.slot));
  await assertCalculator("37", 74);
  report.checks.push("connected-parent move preserves or recovers the active calculation");
  await progress("connected move verified");

  await page.evaluate(async () => {
    const parent = window.slot.parentElement;
    window.slot.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    parent.append(window.slot);
  });
  await assertCalculator("37", 74);
  report.checks.push("detach and reappend recovers a reloaded browsing context");
  await progress("detach reappend verified");

  await page.evaluate(async () => {
    const replacement = document.createElement("div");
    replacement.id = "slot-replacement";
    document.querySelector("#left").append(replacement);
    await window.host.updateArtifact(
      "relocation",
      [
        {
          artifactId: "relocation",
          blockId: "calculator",
          source: window.source,
          container: replacement,
        },
      ],
      { phase: "commit", reset: false },
    );
    window.slot = replacement;
  });
  await assertCalculator("37", 74);
  assert.equal(await activeFrame().locator("html").getAttribute("data-relocation-restore"), "37");
  report.checks.push("same block and artifact replacement container restores current state");
  await progress("replacement verified");

  await page.evaluate(() => window.host.resetArtifact("relocation"));
  await assertCalculator("12", 24);
  assert.equal(await activeFrame().locator("html").getAttribute("data-relocation-restore"), null);
  report.checks.push("explicit reset clears relocation cache and applies source defaults");
  await progress("reset verified");

  await activeFrame().locator("#voltage input").fill("37");
  await page.waitForTimeout(0);
  for (let index = 0; index < 10; index++) {
    await page.evaluate(async (index) => {
      const replacement = document.createElement("div");
      replacement.id = `slot-cycle-${index}`;
      document.querySelector(index % 2 ? "#left" : "#right").append(replacement);
      await window.host.updateArtifact(
        "relocation",
        [
          {
            artifactId: "relocation",
            blockId: "calculator",
            source: window.source,
            container: replacement,
          },
        ],
        { phase: "commit", reset: false },
      );
      window.slot = replacement;
    }, index);
    await assertCalculator("37", 74);
  }
  report.checks.push("ten replacement relocations retain one live calculator");
  await progress("cycles verified");

  await activeFrame().locator('#reset').click();
  await assertCalculator('12', 24);
  await page.waitForTimeout(0);
  await page.evaluate(() => document.querySelector('#left').append(window.slot));
  await assertCalculator('12', 24);
  report.checks.push('button-driven input reset is checkpointed before relocation');
  await activeFrame().locator('#voltage input').fill('37');
  await assertCalculator('37', 74);
  await page.waitForTimeout(0);

  await page.evaluate(async () => {
    const outer = document.createElement("iframe");
    outer.id = "foreign-owner";
    const loaded = new Promise((resolve) => {
      outer.onload = resolve;
    });
    outer.srcdoc = "<!doctype html><body><main id='foreign-slot'></main></body>";
    document.querySelector("#other").append(outer);
    await loaded;
    const container = outer.contentDocument.querySelector("#foreign-slot");
    await window.host.updateArtifact(
      "relocation",
      [{ artifactId: "relocation", blockId: "calculator", source: window.source, container }],
      { phase: "commit", reset: false },
    );
    window.slot = container;
  });
  const foreignFrame = page
    .frameLocator("#foreign-owner")
    .frameLocator("iframe.slexkit-html-frame");
  await foreignFrame.locator("#voltage input").waitFor();
  assert.equal(await foreignFrame.locator("#voltage input").inputValue(), "37");
  assert.equal(await foreignFrame.locator("#power").evaluate((element) => element.value), 74);
  assert.equal(await foreignFrame.locator("html").getAttribute("data-relocation-restore"), "37");
  assert.equal(await page.locator("iframe.slexkit-html-frame").count(), 0);
  report.checks.push(
    "foreign owner-document replacement has an explicit state boundary and restore",
  );
  await progress("foreign owner relocation verified");

  await page.evaluate(() => window.host.disposeAll());
  await foreignFrame.locator("body").waitFor({ state: "detached" });
  await page.evaluate(() => document.querySelector("#foreign-owner")?.remove());
  await page.waitForTimeout(300);
  const resources = await page.evaluate(() => window.resourceSnapshot());
  const baseline = await page.evaluate(() => window.resourceBaseline);
  assert.deepEqual(resources, baseline);
  assert.equal(resources.iframes, 0);
  report.resources = resources;
  report.checks.push("dispose releases all tracked controllers and parent resources");
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log(`${name}: ${report.checks.length} frame relocation checks passed`);
} catch (error) {
  report.passed = false;
  report.error = error.stack;
  process.exitCode = 1;
  console.error(error);
} finally {
  clearTimeout(watchdog);
  await writeFile(new URL(`${name}.json`, output), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
