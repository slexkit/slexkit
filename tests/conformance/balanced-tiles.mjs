import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const output = resolve("test-results/stat-overflow-review/alignment");
await mkdir(output, { recursive: true });
const port = process.env.SLEXKIT_BALANCED_PORT || "4222";
const server = spawn("bun", ["examples/dev-server.mjs", "web-components"], {
  env: { ...process.env, PORT: port }, windowsHide: true, stdio: "ignore",
});
const base = `http://127.0.0.1:${port}`;
const fingerprints = async () => Object.fromEntries(await Promise.all(["dist/web-components.js", "dist/slexkit.css", "tests/conformance/balanced-tiles.mjs"].map(async file => [file, createHash("sha256").update(await readFile(file)).digest("hex")])));
const report = { date: new Date().toISOString(), artifactHashes: await fingerprints(), layouts: [], transitions: [], resources: [] };
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if (server.exitCode !== null) throw new Error("Fixture server exited");
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch();
    try {
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({ viewport: { width: 1024, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.addInitScript(() => {
          const observed = { ResizeObserver: new Set(), MutationObserver: new Set() };
          for (const name of Object.keys(observed)) {
            const Original = window[name];
            window[name] = class extends Original {
              observe(...args) { observed[name].add(this); return super.observe(...args); }
              disconnect() { observed[name].delete(this); return super.disconnect(); }
            };
          }
          const timeouts = new Set(), frames = new Set(), fontListeners = new Set();
          const set = window.setTimeout.bind(window), clear = window.clearTimeout.bind(window);
          window.setTimeout = (fn, delay, ...args) => {
            const id = set(() => { timeouts.delete(id); fn(...args); }, delay); timeouts.add(id); return id;
          };
          window.clearTimeout = id => { timeouts.delete(id); clear(id); };
          const raf = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
          window.requestAnimationFrame = fn => { const id = raf(time => { frames.delete(id); fn(time); }); frames.add(id); return id; };
          window.cancelAnimationFrame = id => { frames.delete(id); cancel(id); };
          const add = document.fonts.addEventListener.bind(document.fonts), remove = document.fonts.removeEventListener.bind(document.fonts);
          document.fonts.addEventListener = (type, fn, options) => { if (type === "loadingdone") fontListeners.add(fn); add(type, fn, options); };
          document.fonts.removeEventListener = (type, fn, options) => { if (type === "loadingdone") fontListeners.delete(fn); remove(type, fn, options); };
          window.__resources = () => ({ resize: observed.ResizeObserver.size, mutation: observed.MutationObserver.size, timeouts: timeouts.size, frames: frames.size, fonts: fontListeners.size });
        });
        await page.goto(base);
        await page.waitForFunction(() => !!customElements.get("slex-row"));
        await page.evaluate(theme => {
          document.documentElement.className = theme;
          document.documentElement.dataset.theme = theme;
          document.body.replaceChildren();
          document.body.style.cssText = `margin:24px auto;max-width:960px;padding:0 16px;background:${theme === "dark" ? "#09090b" : "#fff"};color:${theme === "dark" ? "#fafafa" : "#18181b"};font:14px system-ui`;
          for (const count of [2, 3, 5, 7]) {
            const heading = document.createElement("h2"); heading.textContent = `${count} metrics · automatic layout`; document.body.append(heading);
            const row = document.createElement("slex-row"); row.id = `stats-${count}`;
            for (let i = 0; i < count; i++) {
              const stat = document.createElement("slex-stat"); stat.id = `metric-${count}-${i}`;
              stat.label = i === 1 ? "Measured output voltage after compensation" : ["Voltage", "Current", "Power", "Resistance", "Frequency", "Capacitance", "Gain"][i];
              stat.value = i === 2 ? Math.PI : i === 3 ? 123456789.123456 : [12, 2.5, 30, 1000, 500000, 0.000000123456789, 3.3][i];
              stat.unit = ["V", "A", "W", "Ω", "Hz", "F", "dB"][i]; row.append(stat);
            }
            document.body.append(row);
          }
          const heading = document.createElement("h2"); heading.textContent = "5 cards · native slots and live controls"; document.body.append(heading);
          const row = document.createElement("slex-row"); row.id = "cards-5";
          for (let i = 0; i < 5; i++) {
            const card = document.createElement("slex-card"); card.title = `Channel ${i + 1}`;
            const input = document.createElement("slex-input"); input.label = "Setpoint"; input.value = `${i + 1}.000`; card.append(input);
            if (i % 2) { const note = document.createElement("p"); note.textContent = "A longer note tests equal card height without replacing or truncating the content."; card.append(note); }
            row.append(card);
          }
          document.body.append(row);
          window.__input = row.querySelector("slex-input"); window.__input.value = "27.000";
          window.__number = document.querySelector("#metric-5-2").shadowRoot.querySelector(".slex-stat-number");
        }, theme);
        await page.waitForFunction(() => [...document.querySelectorAll("slex-row")].every(row => row.shadowRoot.querySelector(".slex-row--balanced-tiles")));
        await page.evaluate(() => document.fonts.ready);
        for (const width of [1024, 768, 390, 1024]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.waitForTimeout(250);
          const layouts = await page.evaluate(() => [...document.querySelectorAll("slex-row")].map(row => {
            const layout = row.shadowRoot.querySelector(".slex-row"), bounds = layout.getBoundingClientRect();
            const items = [...row.children].map(host => {
              const card = host.shadowRoot.querySelector(".slex-stat,.slex-card"), rect = host.getBoundingClientRect(), inner = card.getBoundingClientRect();
              const value = host.shadowRoot.querySelector(".slex-stat-value"), number = host.shadowRoot.querySelector(".slex-stat-number");
              return { id: host.id, x: rect.x, y: rect.y, width: rect.width, height: rect.height, innerHeight: inner.height, valueBottom: value?.getBoundingClientRect().bottom, clipped: number ? number.scrollWidth > number.clientWidth + 1 : false, display: number?.textContent };
            });
            return { id: row.id, x: bounds.x, width: bounds.width, display: getComputedStyle(layout).display, pageOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), items };
          }));
          for (const layout of layouts) {
            assert.equal(layout.display, "grid"); assert.ok(layout.pageOverflow <= 1);
            const rows = new Map();
            for (const item of layout.items) {
              const key = Math.round(item.y); if (!rows.has(key)) rows.set(key, []); rows.get(key).push(item);
              assert.ok(Math.abs(item.height - item.innerHeight) <= 1, `${name} ${width} ${layout.id}: inner card must fill its host`);
              assert.equal(item.clipped, false, `${name} ${width} ${layout.id}: numeric value must fit`);
            }
            for (const items of rows.values()) {
              assert.ok(Math.abs(items[0].x - layout.x) <= 1);
              assert.ok(Math.abs(items.at(-1).x + items.at(-1).width - layout.x - layout.width) <= 1, "last row fills width");
              assert.ok(Math.max(...items.map(i => i.height)) - Math.min(...items.map(i => i.height)) <= 1, "equal row heights");
              assert.ok(Math.max(...items.map(i => i.width)) - Math.min(...items.map(i => i.width)) <= 1, "equal widths within row");
              if (layout.id.startsWith("stats")) assert.ok(Math.max(...items.map(i => i.valueBottom)) - Math.min(...items.map(i => i.valueBottom)) <= 1, "aligned numeric baselines");
            }
            if (rows.size > 1 && [...rows.values()][0].length > 1) assert.notEqual([...rows.values()].at(-1).length, 1, "no isolated last tile");
            report.layouts.push({ browser: name, version: browser.version(), theme, viewport: width, ...layout, passed: true });
          }
          const identity = await page.evaluate(() => ({ input: document.querySelector("#cards-5 slex-input") === window.__input, value: window.__input.value, number: document.querySelector("#metric-5-2").shadowRoot.querySelector(".slex-stat-number") === window.__number }));
          assert.deepEqual(identity, { input: true, value: "27.000", number: true });
          if (width === 768) await page.locator("#stats-5").screenshot({ path: resolve(output, `${name}-${width}-${theme}-balanced-row.png`), animations: "disabled" });
          if (width !== 768) await page.screenshot({ path: resolve(output, `${name}-${width}-${theme}.png`), fullPage: true });
        }
        await page.evaluate(() => {
          const row = document.querySelector("#stats-5"); row.append(row.firstElementChild);
          const tile = document.createElement("slex-stat"); tile.value = 42; tile.label = "Added metric"; row.append(tile); window.__added = tile;
        });
        await page.waitForTimeout(180);
        assert.equal(await page.locator("#stats-5").evaluate(row => row.children.length), 6);
        await page.evaluate(() => window.__added.remove());
        await page.waitForTimeout(100);
        assert.equal(await page.locator("#stats-5").evaluate(row => row.children.length), 5);
        await page.locator("#stats-5").evaluate(row => row.align = "start");
        await page.waitForTimeout(100);
        assert.equal(await page.locator("#stats-5").evaluate(row => getComputedStyle(row.shadowRoot.querySelector(".slex-row")).display), "flex");
        assert.equal(await page.locator("#stats-5").evaluate(row => [...row.children].some(e => e.hasAttribute("data-slex-balanced-tile") || e.style.gridColumn)), false);
        await page.locator("#stats-5").evaluate(row => row.align = "");
        await page.waitForTimeout(180);
        assert.equal(await page.locator("#stats-5").evaluate(row => getComputedStyle(row.shadowRoot.querySelector(".slex-row")).display), "grid");
        // The document host synchronizes authored attributes during content updates.
        // Its removal of runtime-owned inline layout must not disable balancing.
        await page.evaluate(() => {
          const tile = document.querySelector("#metric-5-2");
          tile.removeAttribute("style"); tile.removeAttribute("data-slex-balanced-tile");
        });
        await page.waitForTimeout(180);
        assert.equal(await page.locator("#metric-5-2").getAttribute("data-slex-balanced-tile"), "stat");
        assert.notEqual(await page.locator("#metric-5-2").evaluate(tile => tile.style.gridColumn), "");
        await page.evaluate(() => document.querySelector("#stats-7").append(document.querySelector("#metric-5-2")));
        await page.waitForTimeout(180);
        assert.equal(await page.locator("#metric-5-2").getAttribute("data-slex-balanced-tile"), "stat");
        await page.evaluate(() => document.querySelector("#stats-5").append(document.querySelector("#metric-5-2")));
        await page.waitForTimeout(180);
        assert.equal(await page.locator("#metric-5-2").getAttribute("data-slex-balanced-tile"), "stat");
        assert.equal(await page.locator("#metric-5-2").evaluate(tile => tile.shadowRoot.querySelector(".slex-stat-number") === window.__number), true);
        report.transitions.push({ browser: name, theme, reorder: true, insertRemove: true, explicitAlignment: true, sourceAttributes: true, crossRowMove: true, stateIdentity: true });
        await page.waitForTimeout(150);
        const before = await page.evaluate(() => window.__resources());
        await page.evaluate(async () => {
          for (let i = 0; i < 100; i++) {
            const row = document.createElement("slex-row");
            row.innerHTML = '<slex-stat value="3.141592653589793"></slex-stat><slex-stat value="1.000"></slex-stat>';
            document.body.append(row); await new Promise(resolve => setTimeout(resolve, 5)); row.remove(); await new Promise(resolve => setTimeout(resolve, 0));
          }
        });
        await page.waitForTimeout(180);
        const after = await page.evaluate(() => window.__resources());
        assert.deepEqual(after, before, `${name} ${theme}: 100 mount/unmount cycles leave no managed resources`);
        assert.deepEqual(errors, []);
        report.resources.push({ browser: name, theme, cycles: 100, before, after, passed: true });
        await page.close();
      }
    } finally { await browser.close(); }
  }
  assert.deepEqual(await fingerprints(), report.artifactHashes, "Artifacts changed during the browser run");
  report.passed = true;
} catch (error) { report.passed = false; report.error = error.stack; }
finally { server.kill(); await writeFile(resolve(output, "measurements.json"), JSON.stringify(report, null, 2)); }
console.log(JSON.stringify({ passed: report.passed, layouts: report.layouts.length, transitions: report.transitions.length, resources: report.resources, error: report.error }));
if (!report.passed) process.exitCode = 1;
