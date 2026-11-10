import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { chromium, firefox, webkit } from "playwright";

const root = new URL("../", import.meta.url);
const output = new URL("test-results/web-components/", root);
const styleOutput = new URL("test-results/html-style-review/", root);
await mkdir(output, { recursive: true });
await mkdir(styleOutput, { recursive: true });
const port = 4196;
const server = spawn("bun", ["examples/dev-server.mjs", "web-components"], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore",
  windowsHide: true,
});
let launchError;
server.on("error", (error) => {
  launchError = error;
});
const report = {
  createdAt: new Date().toISOString(),
  browsers: [],
  bundle: {},
  scope: "Web Components only; no HTML Markdown host or generated-code security claim",
};
const styleReport = { createdAt: new Date().toISOString(), browsers: [] };
const requiredThemeTokens = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover",
  "--popover-foreground", "--primary", "--primary-foreground", "--secondary",
  "--secondary-foreground", "--muted", "--muted-foreground", "--accent",
  "--accent-foreground", "--destructive", "--destructive-foreground", "--border",
  "--input", "--ring",
];

async function measureRepresentativeStyles(page) {
  return page.evaluate(() => {
    const inspect = (hostSelector, innerSelector) => {
      const host = document.querySelector(hostSelector);
      const root = host.shadowRoot.querySelector(".slexkit-root");
      const element = host.shadowRoot.querySelector(innerSelector);
      const rootStyle = getComputedStyle(root);
      const style = getComputedStyle(element);
      return {
        rootClass: root.className,
        primary: rootStyle.getPropertyValue("--primary").trim(),
        radiusToken: rootStyle.getPropertyValue("--slex-radius").trim(),
        fontToken: rootStyle.getPropertyValue("--slex-font-sans").trim(),
        color: style.color,
        background: style.backgroundColor,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        fontFamily: style.fontFamily,
        height: style.height,
        padding: style.padding,
      };
    };
    const rowHost = document.querySelector("#style-review-row");
    const row = rowHost.shadowRoot.querySelector(".slex-row");
    const rowStyle = getComputedStyle(row);
    return {
      input: inspect('.calculator slex-input[name="voltage"]', "input"),
      card: inspect(".calculator slex-card", ".slex-card"),
      button: inspect(".calculator slex-button", "button"),
      stat: inspect(".calculator slex-stat", ".slex-stat"),
      layout: {
        rootClass: row.closest(".slexkit-root").className,
        display: rowStyle.display,
        gap: rowStyle.gap,
        alignItems: rowStyle.alignItems,
        slotCount: row.querySelector("slot").assignedElements().length,
      },
    };
  });
}
const bundle = await readFile(new URL("dist/web-components.js", root));
assert.doesNotMatch(
  bundle.toString(),
  /new Function\s*\(|parseSlexSource|evalRead|execWrite|acorn/,
);
report.bundle = {
  raw: bundle.length,
  gzip: gzipSync(bundle).length,
  parserAndEvaluatorAbsent: true,
};
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (launchError) throw launchError;
    if (server.exitCode !== null) throw new Error(`Example server exited ${server.exitCode}`);
    try {
      if ((await fetch(`http://localhost:${port}/dist/web-components.js`)).ok) break;
    } catch {
      /* server starting */
    }
    if (attempt === 59) throw new Error("Example server did not become ready");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1024, height: 850 } });
      page.setDefaultTimeout(8000);
      const errors = [];
      const requests = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => requests.push(request.url()));
      await page.goto(`http://localhost:${port}/examples/web-components/`);
      await page.evaluate(() => {
        const row = document.createElement("slex-row");
        row.id = "style-review-row";
        row.innerHTML =
          '<slex-button label="Layout action"></slex-button><slex-stat label="Layout stat" value="8"></slex-stat>';
        document.querySelector("main").append(row);
      });
      const calculators = page.locator(".calculator");
      const voltage = calculators.nth(0).locator('slex-input[name="voltage"] input');
      await voltage.fill("2.2k");
      assert.equal(
        await calculators
          .nth(0)
          .locator("slex-stat")
          .evaluate((element) => element.value),
        4400,
      );
      assert.equal(
        await calculators
          .nth(1)
          .locator("slex-stat")
          .evaluate((element) => element.value),
        2.5,
      );
      await voltage.fill("invalid");
      assert.equal(
        await calculators
          .nth(0)
          .locator("slex-stat")
          .evaluate((element) => element.value),
        "请输入有效数值",
      );
      await calculators.nth(0).locator("slex-button button").click();
      assert.equal(await voltage.inputValue(), "12");
      await voltage.fill("37");
      await voltage.focus();
      const update = await voltage.evaluate((input) => {
        const element = input.getRootNode().host;
        input.setSelectionRange(1, 2);
        element.label = "Updated voltage";
        return {
          same: element.shadowRoot.querySelector("input") === input,
          focus: element.shadowRoot.activeElement === input,
          selection: [input.selectionStart, input.selectionEnd],
          value: element.value,
        };
      });
      assert.deepEqual(update, { same: true, focus: true, selection: [1, 2], value: "37" });
      const lightStyles = await measureRepresentativeStyles(page);
      assert.match(lightStyles.card.rootClass, /slexkit-theme-uno/);
      assert.equal(lightStyles.card.primary, "oklch(21% 0.006 285.885)");
      assert.equal(lightStyles.card.borderRadius, "12px");
      assert.equal(lightStyles.input.borderRadius, "8px 0px 0px 8px");
      assert.equal(lightStyles.button.borderRadius, "8px");
      assert.equal(lightStyles.layout.display, "flex");
      assert.equal(lightStyles.layout.slotCount, 2);

      const themeScenarios = await page.evaluate(async (requiredTokens) => {
        const main = document.querySelector("main");
        const create = (id, tokens) => {
          const boundary = document.createElement("div");
          boundary.id = id;
          for (const [token, value] of Object.entries(tokens))
            boundary.style.setProperty(token, value);
          boundary.innerHTML = '<slex-button label="Theme probe"></slex-button>';
          main.append(boundary);
          return boundary;
        };
        const read = (boundary) => {
          const host = boundary.querySelector("slex-button");
          const root = host.shadowRoot.querySelector(".slexkit-root");
          const button = host.shadowRoot.querySelector("button");
          return {
            className: button.className,
            rootClass: root.className,
            incomplete: root.hasAttribute("data-slex-incomplete-palette"),
            primary: getComputedStyle(root).getPropertyValue("--primary").trim(),
            slexPrimary: getComputedStyle(root).getPropertyValue("--slex-primary").trim(),
            radius: getComputedStyle(button).borderRadius,
            background: getComputedStyle(button).backgroundColor,
            shadow: getComputedStyle(button).boxShadow,
            font: getComputedStyle(button).fontFamily,
          };
        };
        const missing = create("theme-missing", {});
        const partial = create("theme-partial", { "--primary": "rgb(200, 20, 80)" });
        const completeValues = Object.fromEntries(
          requiredTokens.map((token) => [token, "rgb(40, 40, 44)"]),
        );
        Object.assign(completeValues, {
          "--background": "rgb(250, 250, 252)",
          "--foreground": "rgb(20, 20, 24)",
          "--card": "rgb(250, 250, 252)",
          "--card-foreground": "rgb(20, 20, 24)",
          "--primary": "rgb(95, 20, 180)",
          "--primary-foreground": "rgb(255, 255, 255)",
        });
        const complete = create("theme-complete", completeValues);
        complete.style.setProperty("--radius", "14px");
        complete.style.setProperty("--shadow-sm", "0 3px 7px rgb(1 2 3 / 0.2)");
        complete.style.setProperty("--font-sans", '"Trebuchet MS", sans-serif');
        await Promise.all(
          [missing, partial, complete].map(
            (boundary) =>
              new Promise((resolve) => {
                const link = boundary.querySelector("slex-button").shadowRoot.querySelector("link");
                if (link.sheet) resolve();
                else link.addEventListener("load", resolve, { once: true });
              }),
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
        const initial = { missing: read(missing), partial: read(partial), complete: read(complete) };
        complete.style.setProperty("--primary", "rgb(10, 120, 70)");
        await new Promise((resolve) => setTimeout(resolve, 200));
        const updated = read(complete);
        complete.style.removeProperty("--ring");
        await new Promise((resolve) => setTimeout(resolve, 200));
        const downgraded = read(complete);
        missing.remove();
        partial.remove();
        complete.remove();
        return { initial, updated, downgraded };
      }, requiredThemeTokens);
      assert.match(themeScenarios.initial.missing.rootClass, /slexkit-theme-uno/);
      assert.match(themeScenarios.initial.partial.rootClass, /slexkit-theme-uno/);
      assert.match(themeScenarios.initial.complete.rootClass, /slexkit-theme-host-shadcn/);
      assert.equal(themeScenarios.initial.complete.radius, "14px");
      assert.equal(themeScenarios.initial.complete.primary, "rgb(95, 20, 180)");
      assert.equal(themeScenarios.initial.complete.background, "rgb(95, 20, 180)");
      assert.equal(themeScenarios.updated.primary, "rgb(10, 120, 70)");
      assert.equal(themeScenarios.updated.background, "rgb(10, 120, 70)");
      assert.match(themeScenarios.downgraded.rootClass, /slexkit-theme-uno/);
      await page.screenshot({
        path: new URL(`${name}-light.png`, output).pathname.replace(/^\/(\w:)/, "$1"),
        fullPage: true,
      });
      await page.screenshot({
        path: new URL(`after-${name}-light.png`, styleOutput).pathname.replace(/^\/(\w:)/, "$1"),
        fullPage: true,
      });
      await page.locator("#theme").click();
      await page.waitForFunction(() =>
        document
          .querySelector("slex-stat")
          .shadowRoot.querySelector(".slexkit-root")
          .classList.contains("dark"),
      );
      await page.waitForTimeout(200);
      const colors = await calculators
        .nth(0)
        .locator("slex-input input")
        .first()
        .evaluate((element) => ({
          foreground: getComputedStyle(element).color,
          background: getComputedStyle(element).backgroundColor,
        }));
      assert.notEqual(colors.foreground, colors.background);
      const contrast = await calculators
        .nth(0)
        .locator("slex-stat .slex-stat")
        .evaluate((element, requiredThemeTokens) => {
          const luminance = (color) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d");
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            const channels = Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3))
              .map((value) => {
                const channel = value / 255;
                return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
              });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          };
          const style = getComputedStyle(element);
          const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
            (a, b) => a - b,
          );
          const root = element.closest(".slexkit-root");
          const host = element.getRootNode().host;
          const parentCard = host.closest("slex-card");
          return {
            ratio: (values[1] + 0.05) / (values[0] + 0.05),
            color: style.color,
            background: style.backgroundColor,
            root: root.outerHTML.slice(0, 180),
            tokens: [
              style.getPropertyValue("--slex-foreground"),
              style.getPropertyValue("--slex-muted"),
            ],
            hostTokens: requiredThemeTokens.map((token) => [token, getComputedStyle(host).getPropertyValue(token).trim()]),
            parentRoot: parentCard?.shadowRoot.querySelector(".slexkit-root")?.className,
          };
        }, requiredThemeTokens);
      const darkStyles = await measureRepresentativeStyles(page);
      assert.equal(darkStyles.card.primary, "oklch(98.5% 0 0)");
      assert.equal(darkStyles.card.borderRadius, "12px");
      assert.ok(contrast.ratio >= 4.5, `Dark result contrast ${JSON.stringify(contrast)}`);
      await page.screenshot({
        path: new URL(`${name}-dark.png`, output).pathname.replace(/^\/(\w:)/, "$1"),
        fullPage: true,
      });
      await page.screenshot({
        path: new URL(`after-${name}-dark.png`, styleOutput).pathname.replace(/^\/(\w:)/, "$1"),
        fullPage: true,
      });
      const fixture = await page.evaluate(async () => {
        const { defineSlexElements, describeSlexElements } =
          await import("/dist/web-components.js");
        const form = document.createElement("form");
        form.innerHTML =
          '<fieldset><slex-input name="required" label="Required" required value="ok"></slex-input><slex-checkbox name="check" checked label="Check"></slex-checkbox><slex-switch name="switch" checked label="Switch"></slex-switch><slex-slider name="range" value="7" label="Range"></slex-slider></fieldset>';
        document.body.append(form);
        const field = form.querySelector("slex-input");
        const checkbox = form.querySelector("slex-checkbox");
        const toggle = form.querySelector("slex-switch");
        const inputValues = [];
        checkbox.addEventListener("input", () => inputValues.push(checkbox.checked));
        let changes = 0;
        checkbox.addEventListener("change", () => changes++);
        checkbox.shadowRoot.querySelector("input").click();
        const data = () => Object.fromEntries(new FormData(form));
        const unchecked = data();
        form.reset();
        const reset = data();
        field.value = "";
        const invalid = !form.checkValidity();
        field.disabled = true;
        const disabled = data();
        field.disabled = false;
        field.value = "again";
        field.name = "renamed";
        const renamed = data();
        form.querySelector("fieldset").disabled = true;
        const fieldset = data();
        form.querySelector("fieldset").disabled = false;
        toggle.enabled = false;
        const aliases = toggle.checked === false;
        const range = form.querySelector("slex-slider");
        range.setAttribute("max", "10");
        range.setAttribute("step", "2");
        range.value = 99;
        const rangeClamp = range.value;
        range.value = 3;
        const rangeStep = range.value;
        field.removeAttribute("value");
        const removedValue = [field.value, field.shadowRoot.querySelector("input").value];
        let inputs = 0;
        field.addEventListener("input", () => inputs++);
        const original = field.shadowRoot.querySelector("input");
        form.append(field);
        const moved = original === field.shadowRoot.querySelector("input");
        for (let index = 0; index < 100; index++) {
          field.remove();
          await Promise.resolve();
          if (field.shadowRoot.querySelector("input"))
            throw new Error("Detached control was not released");
          form.append(field);
        }
        const current = field.shadowRoot.querySelector("input");
        current.value = "99";
        current.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
        const inputsAfterCycles = inputs;
        // Dynamic slot children remain native DOM; events retain child ownership.
        const row = document.createElement("slex-row");
        row.innerHTML =
          '<slex-input label="Slotted" value="1"></slex-input><slex-stat value="1"></slex-stat>';
        document.body.append(row);
        const slot = row.shadowRoot.querySelector("slot");
        const slotCount = slot.assignedElements().length;
        // Registration in another browsing realm, including pre-upgrade values.
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const other = frame.contentWindow;
        const pre = other.document.createElement("slex-input");
        pre.value = "pre-upgrade";
        other.document.body.append(pre);
        defineSlexElements({ window: other, components: ["input"], cssText: "" });
        const preUpgrade = pre.shadowRoot.querySelector("input").value;
        const isolated = pre !== field && pre.value === "pre-upgrade" && field.value === "99";
        other.document.body.append(field);
        const adoptedInput = field.shadowRoot.querySelector("input");
        adoptedInput.value = "adopted";
        adoptedInput.dispatchEvent(new other.InputEvent("input", { bubbles: true, composed: true }));
        const adoption = field.value === "adopted" && adoptedInput.ownerDocument === other.document;
        form.append(field);
        frame.remove();
        row.remove();
        form.remove();
        await Promise.resolve();
        return {
          inputValues,
          changes,
          unchecked,
          reset,
          invalid,
          disabled,
          renamed,
          fieldset,
          aliases,
          rangeClamp,
          rangeStep,
          removedValue,
          moved,
          inputs: inputsAfterCycles,
          slotCount,
          preUpgrade,
          isolated,
          adoption,
          count: describeSlexElements().length,
        };
      });
      assert.deepEqual(fixture.inputValues, [false]);
      assert.equal(fixture.changes, 1);
      assert.deepEqual(fixture.unchecked, { required: "ok", switch: "on", range: "7" });
      assert.deepEqual(fixture.reset, { required: "ok", check: "on", switch: "on", range: "7" });
      assert.equal(fixture.invalid, true);
      assert.equal("required" in fixture.disabled, false);
      assert.equal(fixture.renamed.renamed, "again");
      assert.deepEqual(fixture.fieldset, {});
      assert.equal(fixture.aliases, true);
      assert.equal(fixture.rangeClamp, 10);
      assert.equal(fixture.rangeStep, 4);
      assert.deepEqual(fixture.removedValue, ["", ""]);
      assert.equal(fixture.moved, true);
      assert.equal(fixture.inputs, 1);
      assert.equal(fixture.slotCount, 2);
      assert.equal(fixture.preUpgrade, "pre-upgrade");
      assert.equal(fixture.isolated, true);
      assert.equal(fixture.adoption, true);
      await page.setViewportSize({ width: 360, height: 780 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.screenshot({
        path: new URL(`${name}-mobile.png`, output).pathname.replace(/^\/(\w:)/, "$1"),
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      assert.equal(
        requests.some(
          (url) => !url.startsWith(`http://localhost:${port}/`) && !url.startsWith("about:"),
        ),
        false,
      );
      report.browsers.push({
        name,
        version: browser.version(),
        passed: true,
        fixture,
        colors,
        resultContrast: contrast,
        pageErrors: errors,
        requests,
      });
      styleReport.browsers.push({ name, version: browser.version(), lightStyles, darkStyles, themeScenarios });
      console.log(`${name}: component conformance passed`);
    } finally {
      await browser.close();
    }
  }
} catch (error) {
  report.error = error.stack;
  process.exitCode = 1;
  console.error(error);
} finally {
  server.kill();
  await writeFile(new URL("report.json", output), JSON.stringify(report, null, 2));
  await writeFile(new URL("measurements.json", styleOutput), JSON.stringify(styleReport, null, 2));
}
