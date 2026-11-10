import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
const name = process.argv[2] ?? "chromium";
const engine = { chromium, firefox, webkit }[name];
const server = await engine.launchServer({ headless: true });
console.log(JSON.stringify({ browserPid: server.process().pid, name }));
const watchdog = setTimeout(() => server.process().kill(), 90_000);
const browser = await engine.connect(server.wsEndpoint());
const report = { browser: name, version: browser.version() };
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:4197/");
  report.resources = await page.evaluate(async () => {
    const runtime = await import("/dist/slexkit.js");
    const target = document.querySelector("#root");
    const original = { add: window.addEventListener, remove: window.removeEventListener, observer: window.MutationObserver, timeout: window.setTimeout, clearTimeout: window.clearTimeout, matchMedia: window.matchMedia };
    const listeners = new Set(); const observers = new Set(); const timers = new Set(); const media = new Set();
    window.addEventListener = function(type, listener, ...args) { if (type === "message") listeners.add(listener); return original.add.call(this, type, listener, ...args); };
    window.removeEventListener = function(type, listener, ...args) { if (type === "message") listeners.delete(listener); return original.remove.call(this, type, listener, ...args); };
    window.MutationObserver = class extends original.observer {
      observe(...args) { observers.add(this); return super.observe(...args); }
      disconnect() { observers.delete(this); return super.disconnect(); }
    };
    window.setTimeout = function(callback, ...args) { const id = original.timeout.call(this, (...values) => { timers.delete(id); callback(...values); }, ...args); timers.add(id); return id; };
    window.clearTimeout = function(id) { timers.delete(id); return original.clearTimeout.call(this, id); };
    window.matchMedia = function(query) {
      const result = original.matchMedia.call(this, query);
      const add = result.addEventListener.bind(result), remove = result.removeEventListener.bind(result);
      const active = new Set();
      result.addEventListener = (type, listener, ...args) => { if (type === "change") { active.add(listener); media.add(active); } return add(type, listener, ...args); };
      result.removeEventListener = (type, listener, ...args) => { if (type === "change") { active.delete(listener); if (!active.size) media.delete(active); } return remove(type, listener, ...args); };
      return result;
    };
    const options = { secureFrame: { runtimeUrl: new URL("/dist/slexkit.js", location.href).href, styleUrl: false, teardownTimeoutMs: 250 } };
    let cycles = 0;
    try {
      for (; cycles < 100; cycles++) {
        const handle = runtime.mount('<slex-input id="value" value="0"></slex-input>', target, options);
        await handle.ready;
        await handle.update('<slex-input id="value" value="1" label="Updated"></slex-input>');
        handle();
        const deadline = performance.now() + 1000;
        while (target.querySelector("iframe")) {
          if (performance.now() > deadline) throw new Error("Frame disposal exceeded resource test deadline");
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      await new Promise(resolve => setTimeout(resolve, 0));
      return { cycles, messageListeners: listeners.size, themeObservers: observers.size, timers: timers.size, mediaSubscriptions: media.size, iframes: document.querySelectorAll("iframe").length };
    } finally {
      Object.assign(window, { addEventListener: original.add, removeEventListener: original.remove, MutationObserver: original.observer, setTimeout: original.timeout, clearTimeout: original.clearTimeout, matchMedia: original.matchMedia });
    }
  });
  assert.deepEqual(report.resources, { cycles: 100, messageListeners: 0, themeObservers: 0, timers: 0, mediaSubscriptions: 0, iframes: 0 });
  report.passed = true;
  console.log(`${name}: 100 cycles, tracked parent resources returned to zero`);
} catch (error) { report.passed = false; report.error = error.stack; process.exitCode = 1; console.error(error); }
finally {
  clearTimeout(watchdog);
  await mkdir(new URL("../../test-results/html-migration/", import.meta.url), { recursive: true });
  await writeFile(new URL(`../../test-results/html-migration/${name}-resources.json`, import.meta.url), JSON.stringify(report, null, 2));
  await browser.close(); await server.close();
}
