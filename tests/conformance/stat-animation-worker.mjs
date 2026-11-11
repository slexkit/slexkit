import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const browserName = process.env.SLEXKIT_SITE_BROWSER ?? "chromium";
const engine = { chromium, firefox, webkit }[browserName];
if (!engine) throw new Error(`Unknown browser: ${browserName}`);
const base = (process.argv[2] ?? "http://localhost:4199").replace(/\/$/, "");
const output = resolve("test-results/stat-animation-conformance", browserName);
await mkdir(output, { recursive: true });
const browser = await engine.launch({ headless: true });
const records = [];
try {
  for (const motion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: motion });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}/zh-CN/examples/multi-input-coordination/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    const iframe = page.locator("iframe.slexkit-html-frame").first();
    await iframe.waitFor();
    const frame = await (await iframe.elementHandle()).contentFrame();
    const stat = frame.locator("#result");
    await stat.locator(".slex-stat-character").first().waitFor();
    await frame.waitForFunction(() => {
      const s = document.querySelector("#result");
      return s?.shadowRoot?.querySelector('link[rel="stylesheet"]')?.sheet && String(s.value) === "30";
    }, null, { polling: 100 });
    await stat.scrollIntoViewIfNeeded();
    await stat.evaluate(s => {
      s.shadowRoot.addEventListener("animationstart", event => {
        if (event.target.classList.contains("slex-stat-character-current")) s.__animationStarts = (s.__animationStarts ?? 0) + 1;
      });
    });
    const slider = frame.locator("#right input[type=range]");
    const setSlider = value => slider.evaluate((element, value) => {
      element.value = String(value);
      element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }, value);
    for (const next of [21, 29, 59, 58, 89, 90, 0]) {
      await setSlider(next);
      await frame.waitForFunction(value => Number(document.querySelector("#result")?.value) === value, next + 10, { polling: 25 });
      await page.waitForTimeout(600);
      const value = next + 10;
      const comparison = await stat.evaluate(async (target, value) => {
        const oldReference = target.ownerDocument.querySelector("#animation-reference");
        const reference = target.ownerDocument.createElement("slex-stat");
        reference.id = "animation-reference";
        reference.label = "结果";
        reference.value = value;
        reference.style.cssText = `position:absolute;left:-10000px;top:0;width:${target.getBoundingClientRect().width}px`;
        if (oldReference) oldReference.replaceWith(reference);
        else target.ownerDocument.querySelector("#slex-root").append(reference);
        const link = reference.shadowRoot.querySelector('link[rel="stylesheet"]');
        if (link && !link.sheet) await new Promise(resolve => link.addEventListener("load", resolve, { once: true }));
        await new Promise(resolve => setTimeout(resolve, 80));
        const inspect = element => {
          const root = element.shadowRoot;
          const base = root.querySelector(".slex-stat-value").getBoundingClientRect();
          return {
            raw: String(element.value),
            text: root.querySelector(".slex-stat-number").textContent,
            chars: [...root.querySelectorAll(".slex-stat-character")].map(char => {
              const inner = char.querySelector(".slex-stat-character-current");
              const range = element.ownerDocument.createRange();
              range.selectNodeContents(inner);
              const box = char.getBoundingClientRect();
              const ink = range.getBoundingClientRect();
              return { text: inner.textContent, top: box.top - base.top, bottom: box.bottom - base.top, glyphTop: ink.top - base.top, glyphBottom: ink.bottom - base.top, transform: getComputedStyle(inner).transform };
            }),
          };
        };
        return { target: inspect(target), reference: inspect(reference), animationStarts: target.__animationStarts ?? 0 };
      }, value);
      assert.equal(comparison.target.raw, String(value));
      assert.equal(comparison.target.text, comparison.reference.text);
      assert.equal(comparison.target.chars.length, comparison.reference.chars.length);
      for (let i = 0; i < comparison.target.chars.length; i++) {
        const actual = comparison.target.chars[i], expected = comparison.reference.chars[i];
        assert.ok(Math.abs(actual.top - expected.top) <= 0.8, `${browserName} ${motion} ${value}: digit ${i} box differs from static rendering: ${JSON.stringify(comparison)}`);
        assert.ok(Math.abs(actual.glyphTop - expected.glyphTop) <= 0.8, `${browserName} ${motion} ${value}: digit ${i} glyph differs from static rendering: ${JSON.stringify(comparison)}`);
        assert.ok(actual.glyphTop >= actual.top - 1.5 && actual.glyphBottom <= actual.bottom + 1.5, `${browserName} ${motion} ${value}: glyph is clipped: ${JSON.stringify(comparison)}`);
      }
      const y = comparison.target.chars.map(char => char.top);
      assert.ok(Math.max(...y) - Math.min(...y) <= 0.8, `${browserName} ${motion} ${value}: digits do not share a baseline: ${JSON.stringify(comparison)}`);
      records.push({ browserName, motion, value, ...comparison });
      if (value === 69) await stat.screenshot({ path: resolve(output, `${motion}-69.png`) });
    }
    const starts = await stat.evaluate(s => s.__animationStarts ?? 0);
    if (motion === "reduce") assert.equal(starts, 0, "reduced motion should not start digit animations");
    else assert.ok(starts > 0, "normal motion should animate changed digits");
    await slider.evaluate(async element => {
      for (const value of [1, 8, 18, 48, 59]) {
        element.value = String(value);
        element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    });
    await page.waitForTimeout(700);
    const rapid = await stat.evaluate(s => ({ value: s.value, chars: [...s.shadowRoot.querySelectorAll(".slex-stat-character")].map(c => {const r=c.getBoundingClientRect();return {top:r.top,text:c.textContent}}) }));
    assert.equal(Number(rapid.value), 69);
    assert.ok(Math.max(...rapid.chars.map(c => c.top)) - Math.min(...rapid.chars.map(c => c.top)) <= 0.8, `rapid changes leave misaligned digits: ${JSON.stringify(rapid)}`);
    for (const [value, zoom] of [["-3.14", "1"], ["-3.15", "1"], ["0.001", "1.25"], ["1e-7", "1.25"], ["1.000", "1"]]) {
      await stat.evaluate((target, input) => { target.style.zoom = input.zoom; target.unit = "ms"; target.value = input.value; }, { value, zoom });
      await page.waitForTimeout(650);
      const comparison = await stat.evaluate(async (target, value) => {
        const reference = target.ownerDocument.createElement("slex-stat");
        reference.value = value;
        reference.unit = target.unit;
        reference.style.cssText = `position:absolute;left:-10000px;top:0;width:${target.offsetWidth}px;zoom:${target.style.zoom}`;
        target.ownerDocument.querySelector("#slex-root").append(reference);
        const link = reference.shadowRoot.querySelector('link[rel="stylesheet"]');
        if (link && !link.sheet) await new Promise(resolve => link.addEventListener("load", resolve, { once: true }));
        await new Promise(resolve => setTimeout(resolve, 80));
        const inspect = element => {
          const root = element.shadowRoot;
          const base = root.querySelector(".slex-stat-value").getBoundingClientRect();
          const unit = root.querySelector(".slex-stat-unit").getBoundingClientRect();
          return {
            text: root.querySelector(".slex-stat-number").textContent,
            unitTop: unit.top - base.top,
            chars: [...root.querySelectorAll(".slex-stat-character")].map(char => {
              const inner = char.querySelector(".slex-stat-character-current");
              const range = element.ownerDocument.createRange();
              range.selectNodeContents(inner);
              const box = char.getBoundingClientRect(), glyph = range.getBoundingClientRect();
              return { text: inner.textContent, top: box.top - base.top, bottom: box.bottom - base.top, glyphTop: glyph.top - base.top, glyphBottom: glyph.bottom - base.top };
            }),
          };
        };
        const result = { target: inspect(target), reference: inspect(reference) };
        reference.remove();
        return result;
      }, value);
      assert.equal(comparison.target.text, comparison.reference.text);
      assert.ok(Math.abs(comparison.target.unitTop - comparison.reference.unitTop) <= 1, `${browserName} ${motion} ${value}: unit position differs: ${JSON.stringify(comparison)}`);
      for (let i = 0; i < comparison.target.chars.length; i++) {
        const actual = comparison.target.chars[i], expected = comparison.reference.chars[i];
        assert.ok(Math.abs(actual.top - expected.top) <= 1 && Math.abs(actual.glyphTop - expected.glyphTop) <= 1, `${browserName} ${motion} ${value}: character position differs: ${JSON.stringify(comparison)}`);
        if (/^\d$/.test(actual.text)) assert.ok(actual.glyphTop >= actual.top - 2 && actual.glyphBottom <= actual.bottom + 2, `${browserName} ${motion} ${value}: digit is clipped: ${JSON.stringify(comparison)}`);
      }
      records.push({ browserName, motion, value, zoom, ...comparison });
    }
    await frame.evaluate(() => {
      const initial = document.createElement("slex-stat");
      initial.id = "initial-animation-check";
      initial.label = "Initial";
      initial.animateInitial = true;
      initial.value = 69;
      document.querySelector("#slex-root").append(initial);
      initial.shadowRoot.addEventListener("animationstart", event => {
        if (event.target.classList.contains("slex-stat-character-current")) initial.__starts = (initial.__starts ?? 0) + 1;
      });
    });
    const initial = frame.locator("#initial-animation-check");
    await initial.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const initialState = await initial.evaluate(element => ({
      value: element.value,
      starts: element.__starts ?? 0,
      chars: [...element.shadowRoot.querySelectorAll(".slex-stat-character")].map(char => ({ top: char.getBoundingClientRect().top, transform: getComputedStyle(char.querySelector(".slex-stat-character-current")).transform })),
    }));
    assert.equal(Number(initialState.value), 69);
    if (motion === "reduce") assert.equal(initialState.starts, 0);
    else assert.ok(initialState.starts > 0, `${browserName}: initial animation did not play`);
    assert.ok(Math.max(...initialState.chars.map(char => char.top)) - Math.min(...initialState.chars.map(char => char.top)) <= 0.8, `${browserName} ${motion}: initial animation leaves digits misaligned`);
    for (const char of initialState.chars) assert.ok(char.transform === "none" || char.transform === "matrix(1, 0, 0, 1, 0, 0)", `${browserName} ${motion}: initial animation did not settle: ${char.transform}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`${browserName}: stat animation and settled positions passed`);
} finally {
  await writeFile(resolve(output, "measurements.json"), JSON.stringify(records, null, 2));
  await browser.close();
}
