#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { relative, resolve } from "node:path";
import { createServer } from "node:http";
import { chromium, firefox, webkit } from "playwright";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const outputRoot = resolve(repoRoot, "test-results/layout-compatibility");
const reportPath = resolve(outputRoot, "measurements.json");
const baseUrl = "http://127.0.0.1:4223";
const artifactPaths = ["dist/web-components.js", "dist/slexkit.css", "tests/conformance/layout-compatibility.mjs"];
const activeBrowsers = new Set();
const labels = {
  english: "Measured output voltage after temperature compensation",
  chinese: "温度补偿后的测量输出电压与长期稳定性",
  unbroken: "UnbrokenCalibrationLabel1234567890ABCDEF",
};
const labelEntries = Object.entries(labels);
const numericValues = [
  Math.PI,
  -123456.789,
  0.0000123456789,
  987654.321,
  42.125,
  500000.25,
  -0.000987654,
  1234.56789,
  0.1 + 0.2,
  7654321.25,
  -273.15,
];

await mkdir(outputRoot, { recursive: true });

function relativePath(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

async function artifactHashes() {
  return Object.fromEntries(
    await Promise.all(
      artifactPaths.map(async (path) => [
        path,
        createHash("sha256").update(await readFile(resolve(repoRoot, path))).digest("hex"),
      ]),
    ),
  );
}

function errorRecord(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || String(error),
    stack: error?.stack,
    details: error?.details,
  };
}

class FunctionalFailure extends Error {
  constructor(message, details) {
    super(message);
    this.name = "FunctionalFailure";
    this.details = details;
  }
}

function violation(condition, message, details = undefined) {
  return condition ? [] : [{ message, details }];
}

function maxSpread(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length < 2 ? 0 : Math.max(...finite) - Math.min(...finite);
}

function groupPhysicalRows(items, tolerance = 2) {
  const rows = [];
  for (const item of [...items].sort((a, b) => a.top - b.top || a.left - b.left)) {
    let row = rows.find((candidate) => Math.abs(candidate.top - item.top) <= tolerance);
    if (!row) {
      row = { top: item.top, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }
  return rows
    .sort((a, b) => a.top - b.top)
    .map((row) => ({ ...row, items: row.items.sort((a, b) => a.left - b.left) }));
}

function summarizeRows(rows) {
  return rows.map((row) => ({
    top: row.top,
    count: row.items.length,
    ids: row.items.map((item) => item.id),
    widths: row.items.map((item) => item.width),
    heights: row.items.map((item) => item.height),
    gaps: row.items.slice(1).map((item, index) => item.left - row.items[index].right),
    numericBottoms: row.items.map((item) => item.numberBottom).filter(Number.isFinite),
  }));
}

function validateBalancedGeometry(measurement, expectedCount, caseLabel) {
  const failures = [];
  const tolerance = 1.5;
  failures.push(...violation(measurement.display === "grid", `${caseLabel}: balanced Row must render as grid`, measurement.display));
  failures.push(...violation(measurement.items.length === expectedCount, `${caseLabel}: visible tile count`, {
    expected: expectedCount,
    actual: measurement.items.length,
  }));
  failures.push(...violation(measurement.pageOverflow <= 1, `${caseLabel}: page must not overflow horizontally`, measurement.pageOverflow));

  for (const item of measurement.items) {
    failures.push(...violation(item.width > 0 && item.height > 0, `${caseLabel} ${item.id}: tile must have visible bounds`, item));
    failures.push(...violation(Math.abs(item.left - item.innerLeft) <= tolerance, `${caseLabel} ${item.id}: visible card left edge must fill its host`, item));
    failures.push(...violation(Math.abs(item.right - item.innerRight) <= tolerance, `${caseLabel} ${item.id}: visible card right edge must fill its host`, item));
    failures.push(...violation(Math.abs(item.height - item.innerHeight) <= tolerance, `${caseLabel} ${item.id}: visible card height must fill its host`, item));
    failures.push(...violation(item.left >= measurement.left - tolerance && item.right <= measurement.right + tolerance, `${caseLabel} ${item.id}: tile must stay inside Row bounds`, item));
    failures.push(...violation(!Number.isFinite(item.labelScrollOverflow) || item.labelScrollOverflow <= 1, `${caseLabel} ${item.id}: long label must stay inside its card`, item));
    if (item.kind === "stat" && item.finite) failures.push(...violation(item.physicalValue === item.displayValue, `${caseLabel} ${item.id}: displayed digits must keep their reading order in RTL`, item));
    if (item.kind === "stat" && item.finite && item.innerWidth >= 128) {
      failures.push(...violation(!item.numberClipped, `${caseLabel} ${item.id}: finite numeric display must not clip at a supported card width`, item));
      failures.push(...violation(item.numberRight <= item.valueRight + tolerance, `${caseLabel} ${item.id}: finite number must stay inside value bounds`, item));
    }
    if (item.kind === "card") {
      failures.push(...violation(item.inputVisible, `${caseLabel} ${item.id}: native input inside Card must be visible`, item));
      failures.push(...violation(item.inputRight <= item.innerRight + tolerance, `${caseLabel} ${item.id}: native input must stay inside Card`, item));
      failures.push(...violation(item.inputScrollOverflow <= 1, `${caseLabel} ${item.id}: native input control must not overflow`, item));
      failures.push(...violation(item.inputLabelOverflow <= 1, `${caseLabel} ${item.id}: input label must not overflow its card`, item));
    }
  }

  const rows = groupPhysicalRows(measurement.items);
  for (const [rowIndex, row] of rows.entries()) {
    const rowName = `${caseLabel} physical row ${rowIndex + 1}`;
    failures.push(...violation(Math.abs(row.items[0].left - measurement.left) <= tolerance, `${rowName}: first physical tile must meet the container edge`, {
      tile: row.items[0],
      containerLeft: measurement.left,
    }));
    failures.push(...violation(Math.abs(row.items.at(-1).right - measurement.right) <= tolerance, `${rowName}: final physical tile must fill the container edge`, {
      tile: row.items.at(-1),
      containerRight: measurement.right,
    }));
    failures.push(...violation(maxSpread(row.items.map((item) => item.height)) <= tolerance, `${rowName}: card heights must be equal`, row.items));
    failures.push(...violation(maxSpread(row.items.map((item) => item.width)) <= tolerance, `${rowName}: card widths must be equal`, row.items));
    if (row.items.length > 1) {
      const gaps = row.items.slice(1).map((item, index) => item.left - row.items[index].right);
      failures.push(...violation(gaps.every((gap) => gap >= -tolerance), `${rowName}: cards must not overlap`, gaps));
      failures.push(...violation(maxSpread(gaps) <= tolerance, `${rowName}: physical gaps must be equal`, gaps));
      failures.push(...violation(gaps.every((gap) => Math.abs(gap - measurement.columnGap) <= tolerance), `${rowName}: measured gaps must match the Row gap`, {
        expected: measurement.columnGap,
        actual: gaps,
      }));
    }
    if (row.items.every((item) => item.kind === "stat")) {
      failures.push(...violation(maxSpread(row.items.map((item) => item.numberBottom)) <= tolerance, `${rowName}: numeric baselines must align`, row.items));
    }
  }

  const maximumColumns = Math.max(0, ...rows.map((row) => row.items.length));
  if (rows.length > 1 && maximumColumns > 1) {
    failures.push(...violation(rows.at(-1).items.length !== 1, `${caseLabel}: final row must not contain an isolated tile when multiple columns are available`, summarizeRows(rows)));
  }

  return { failures, rows: summarizeRows(rows) };
}

const fixtureHtml = ({ theme, direction, blockedFont }) => `<!doctype html>
<html lang="en" class="${theme}" data-theme="${theme}" dir="${direction}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SlexKit layout compatibility fixture</title>
    <style>
      ${blockedFont ? '@font-face { font-family: "BlockedComponentFont"; src: url("/dist/fonts/KaTeX_Main-Regular.woff2") format("woff2"); font-display: swap; }' : ""}
      *, *::before, *::after { box-sizing: border-box; }
      html { color-scheme: ${theme}; }
      body {
        margin: 0;
        padding: 12px;
        min-width: 0;
        background: ${theme === "dark" ? "#09090b" : "#ffffff"};
        color: ${theme === "dark" ? "#fafafa" : "#18181b"};
        font-family: system-ui, sans-serif;
        ${blockedFont ? '--font-sans: "BlockedComponentFont", system-ui, sans-serif;' : ""}
      }
      #fixture { width: 100%; max-width: 1200px; min-width: 0; margin: 0 auto; }
      .fixture-hidden { display: none !important; }
      .fixture-section { width: 100%; min-width: 0; margin: 0 0 16px; }
      .zoom-stage { width: max-content; max-width: 100%; margin: 0 0 20px; }
    </style>
    <script type="module">
      import { defineSlexElements } from "/dist/web-components.js";
      defineSlexElements();
      window.__fixtureReady = true;
    </script>
  </head>
  <body>
    <main id="fixture"></main>
  </body>
</html>`;

const report = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  command: {
    executable: process.execPath,
    argv: process.argv.slice(1),
    expected: "node tests/conformance/layout-compatibility.mjs",
  },
  scope: {
    sourceFile: "tests/conformance/layout-compatibility.mjs",
    server: baseUrl,
    builtAssetsOnly: artifactPaths.filter(path => path.startsWith("dist/")),
  },
  evidenceBoundaries: {
    cssZoom: "CSS zoom factors are rendering/layout checks, not OS or browser UI zoom proof.",
    highDpi: "deviceScaleFactor is Playwright emulation, not a physical high-DPI/mobile device proof.",
    browsers: "Playwright engines plus locally installed branded Chromium browsers that launch successfully.",
  },
  limitations: [
    {
      id: "live-direction-change",
      status: "documented-unsupported",
      tested: false,
      note: "Only initial RTL is accepted here; live inherited-direction changes are intentionally not treated as supported behavior.",
    },
  ],
  artifactIntegrity: { paths: artifactPaths, start: null, end: null, unchanged: null },
  server: { port: 4223, url: baseUrl, requests: {}, stopped: false },
  browsers: [],
  cases: [],
  screenshots: [],
  cleanupFailures: [],
};

let server;
let topLevelFailure;

function incrementRequest(pathname) {
  report.server.requests[pathname] = (report.server.requests[pathname] || 0) + 1;
}

async function startServer() {
  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, baseUrl);
      incrementRequest(url.pathname);
      const send = (status, type, body) => { response.writeHead(status, { "content-type": type, "cache-control": "no-store" }); response.end(body); };
      if (url.pathname === "/health") return send(200, "text/plain; charset=utf-8", "ok");
      if (url.pathname === "/" || url.pathname === "/fixture") {
        const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";
        const direction = url.searchParams.get("dir") === "rtl" ? "rtl" : "ltr";
        const blockedFont = url.searchParams.get("blockedFont") === "1";
        return send(200, "text/html; charset=utf-8", fixtureHtml({ theme, direction, blockedFont }));
      }
      if (url.pathname === "/dist/web-components.js") {
        return send(200, "text/javascript; charset=utf-8", await readFile(resolve(repoRoot, "dist/web-components.js")));
      }
      if (url.pathname === "/dist/slexkit.css") {
        return send(200, "text/css; charset=utf-8", await readFile(resolve(repoRoot, "dist/slexkit.css")));
      }
      if (/^\/dist\/fonts\/[a-zA-Z0-9_.-]+\.woff2$/.test(url.pathname)) return send(200, "font/woff2", await readFile(resolve(repoRoot, `.${url.pathname}`)));
      if (url.pathname === "/favicon.ico") return send(204, "text/plain", "");
      return send(404, "text/plain; charset=utf-8", "Not found");
    } catch (error) { response.writeHead(500); response.end(String(error)); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(4223, "127.0.0.1", resolve); });
  const health = await fetch(`${baseUrl}/health`);
  if (!health.ok) throw new Error(`Fixture server health check failed with ${health.status}`);
}

async function createTelemetry(page, spec) {
  const telemetry = { pageErrors: [], responses: [], failedRequests: [], blockedFontRequests: [] };
  page.on("pageerror", (error) => telemetry.pageErrors.push(errorRecord(error)));
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname.startsWith("/dist/")) telemetry.responses.push({ pathname, status: response.status() });
  });
  page.on("requestfailed", (request) => {
    const entry = {
      url: request.url(),
      resourceType: request.resourceType(),
      errorText: request.failure()?.errorText,
    };
    telemetry.failedRequests.push(entry);
    if (spec.blockFonts && new URL(request.url()).pathname.startsWith("/dist/fonts/")) telemetry.blockedFontRequests.push(entry);
  });
  if (spec.blockFonts) {
    await page.route("**/dist/fonts/*.woff2", route => route.abort("blockedbyclient"));
  }
  return telemetry;
}

function telemetryViolations(telemetry, spec) {
  const failures = [];
  failures.push(...telemetry.pageErrors.map((error) => ({ message: "Uncaught page error", details: error })));
  const assetFailures = telemetry.responses.filter((entry) => entry.status !== 200);
  failures.push(...assetFailures.map((entry) => ({ message: "Built asset response was not successful", details: entry })));
  const unexpectedRequestFailures = telemetry.failedRequests.filter((entry) => !(spec.blockFonts && new URL(entry.url).pathname.startsWith("/dist/fonts/")));
  failures.push(...unexpectedRequestFailures.map((entry) => ({ message: "Unexpected network request failure", details: entry })));
  if (spec.blockFonts) {
    failures.push(...violation(telemetry.blockedFontRequests.some(entry => new URL(entry.url).pathname.startsWith("/dist/fonts/")), "Blocked-font case must fail actual component font resources", telemetry));
  }
  return failures;
}

async function openFixture(page, spec, telemetry) {
  const url = new URL("/fixture", baseUrl);
  url.searchParams.set("theme", spec.theme || "light");
  url.searchParams.set("dir", spec.direction || "ltr");
  if (spec.blockFonts) url.searchParams.set("blockedFont", "1");
  await page.goto(url.href, { waitUntil: "load", timeout: 15_000 });
  try {
    await page.waitForFunction(
      () => window.__fixtureReady === true && ["slex-row", "slex-grid", "slex-card", "slex-stat", "slex-input"].every((name) => !!customElements.get(name)),
      undefined,
      { timeout: 10_000 },
    );
  } catch (error) {
    throw new FunctionalFailure("Built native custom elements did not initialize", {
      cause: errorRecord(error),
      telemetry,
    });
  }
  const initialEnvironment = await page.evaluate(() => ({
    directionAttribute: document.documentElement.getAttribute("dir"),
    directionComputed: getComputedStyle(document.documentElement).direction,
    themeClass: document.documentElement.className,
    themeData: document.documentElement.dataset.theme,
    devicePixelRatio: window.devicePixelRatio,
  }));
  const failures = [
    ...violation(initialEnvironment.directionAttribute === (spec.direction || "ltr"), "Fixture direction must be present before component creation", initialEnvironment),
    ...violation(initialEnvironment.directionComputed === (spec.direction || "ltr"), "Initial computed direction must match the case", initialEnvironment),
    ...violation(Math.abs(initialEnvironment.devicePixelRatio - (spec.deviceScaleFactor || 1)) <= 0.01, "Playwright deviceScaleFactor emulation must be active", initialEnvironment),
  ];
  if (failures.length) throw new FunctionalFailure("Fixture environment did not match case configuration", { failures, initialEnvironment });
  return initialEnvironment;
}

async function settle(page, delay = 100) {
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1500))]));
  // Background browser windows can suspend animation frames indefinitely.
  await page.waitForTimeout(delay + 100);
}

async function waitForBalanced(page, selector, expectedVisible) {
  try {
    await page.waitForFunction(
      ({ selector, expectedVisible }) => {
        const host = document.querySelector(selector);
        const layout = host?.shadowRoot?.querySelector(".slex-row");
        if (!host || !layout?.classList.contains("slex-row--balanced-tiles")) return false;
        const visible = [...host.children].filter((child) => {
          const rect = child.getBoundingClientRect();
          return getComputedStyle(child).display !== "none" && rect.width > 0 && rect.height > 0;
        });
        return visible.length === expectedVisible;
      },
      { selector, expectedVisible },
      { timeout: 5_000 },
    );
  } catch (error) {
    throw new FunctionalFailure(`${selector} did not reach balanced native layout`, {
      expectedVisible,
      cause: errorRecord(error),
    });
  }
}

async function measureBalancedRow(page, selector) {
  return page.evaluate((selector) => {
    const host = document.querySelector(selector);
    const layout = host?.shadowRoot?.querySelector(".slex-row");
    if (!host || !layout) throw new Error(`Missing Row ${selector}`);
    const layoutRect = layout.getBoundingClientRect();
    const layoutStyle = getComputedStyle(layout);
    const items = [...host.children]
      .map((tile) => {
        const hostRect = tile.getBoundingClientRect();
        const hostStyle = getComputedStyle(tile);
        if (hostStyle.display === "none" || hostRect.width <= 0 || hostRect.height <= 0) return null;
        const kind = tile.localName === "slex-stat" ? "stat" : tile.localName === "slex-card" ? "card" : "other";
        const inner = tile.shadowRoot?.querySelector(kind === "stat" ? ".slex-stat" : kind === "card" ? ".slex-card" : "*");
        const innerRect = inner?.getBoundingClientRect() || hostRect;
        const value = tile.shadowRoot?.querySelector(".slex-stat-value");
        const number = tile.shadowRoot?.querySelector(".slex-stat-number");
        const inputHost = kind === "card" ? tile.querySelector("slex-input") : null;
        const input = inputHost?.shadowRoot?.querySelector("input");
        const inputRect = input?.getBoundingClientRect();
        const valueRect = value?.getBoundingClientRect();
        const numberRect = number?.getBoundingClientRect();
        return {
          id: tile.id,
          kind,
          left: hostRect.left,
          right: hostRect.right,
          top: hostRect.top,
          bottom: hostRect.bottom,
          width: hostRect.width,
          height: hostRect.height,
          innerLeft: innerRect.left,
          innerRight: innerRect.right,
          innerWidth: innerRect.width,
          innerHeight: innerRect.height,
          finite: kind === "stat" && Number.isFinite(Number(tile.value)),
          displayValue: number?.textContent || "",
          fontFamily: getComputedStyle(number || input || inner).fontFamily,
          physicalValue: number ? [...number.querySelectorAll(".slex-stat-character")].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(character => character.textContent).join("") : "",
          numberClipped: !!number && number.scrollWidth > number.clientWidth + 1,
          numberRight: numberRect?.right,
          numberBottom: numberRect?.bottom,
          valueRight: valueRect?.right,
          labelScrollOverflow: inner?.querySelector(".slex-stat-label,.slex-card-title")?.scrollWidth - inner?.querySelector(".slex-stat-label,.slex-card-title")?.clientWidth,
          inputVisible: !!inputRect && inputRect.width > 0 && inputRect.height > 0,
          inputRight: inputRect?.right,
          inputScrollOverflow: input ? input.scrollWidth - input.clientWidth : 0,
          inputLabelOverflow: inputHost?.shadowRoot?.querySelector(".slex-input-label") ? inputHost.shadowRoot.querySelector(".slex-input-label").scrollWidth - inputHost.shadowRoot.querySelector(".slex-input-label").clientWidth : 0,
        };
      })
      .filter(Boolean);
    return {
      selector,
      display: layoutStyle.display,
      direction: layoutStyle.direction,
      columnGap: Number.parseFloat(layoutStyle.columnGap) || 0,
      balancedColumns: layoutStyle.getPropertyValue("--slex-balanced-cols").trim(),
      balancedTracks: layoutStyle.getPropertyValue("--slex-balanced-tracks").trim(),
      left: layoutRect.left,
      right: layoutRect.right,
      top: layoutRect.top,
      width: layoutRect.width,
      items,
      pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
  }, selector);
}

async function saveScreenshot(page, name, fullPage = true) {
  const path = resolve(outputRoot, `${name.replaceAll(/[^a-zA-Z0-9_.-]/g, "-")}.png`);
  await page.screenshot({ path, fullPage, animations: "disabled" });
  const stored = relativePath(path);
  report.screenshots.push(stored);
  return stored;
}

async function executeCase(browser, browserEntry, spec, run) {
  const record = {
    id: `${browserEntry.id}/${spec.id}`,
    browser: browserEntry.id,
    browserVersion: browserEntry.version,
    category: spec.category,
    viewport: spec.viewport,
    theme: spec.theme || "light",
    initialDirection: spec.direction || "ltr",
    deviceScaleFactor: spec.deviceScaleFactor || 1,
    blockedFonts: !!spec.blockFonts,
    status: "running",
    startedAt: new Date().toISOString(),
  };
  let context;
  let page;
  try {
    context = await browser.newContext({
      viewport: spec.viewport,
      colorScheme: spec.theme || "light",
      reducedMotion: "reduce",
      deviceScaleFactor: spec.deviceScaleFactor || 1,
    });
    page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.setDefaultNavigationTimeout(15000);
    const telemetry = await createTelemetry(page, spec);
    const environment = await openFixture(page, spec, telemetry);
    const outcome = await run(page, spec);
    const failures = [...(outcome.failures || []), ...telemetryViolations(telemetry, spec)];
    record.environment = environment;
    record.evidence = outcome.evidence;
    record.telemetry = telemetry;
    if (failures.length) throw new FunctionalFailure(`${failures.length} functional violation(s)`, failures);
    if (spec.captureOnPass) record.screenshot = await saveScreenshot(page, `${browserEntry.id}-${spec.id}`);
    record.status = "passed";
  } catch (error) {
    record.status = "failed";
    record.failureKind = error instanceof FunctionalFailure ? "functional" : "harness";
    record.error = errorRecord(error);
    if (page && !page.isClosed()) {
      try {
        record.failureScreenshot = await saveScreenshot(page, `${browserEntry.id}-${spec.id}-failure`);
      } catch (screenshotError) {
        record.screenshotError = errorRecord(screenshotError);
      }
    }
  } finally {
    if (context) {
      try {
        await context.close();
      } catch (error) {
        report.cleanupFailures.push({ target: record.id, resource: "browser-context", error: errorRecord(error) });
      }
    }
    record.finishedAt = new Date().toISOString();
    report.cases.push(record);
    console.log(`${record.id}: ${record.status}`);
  }
}

async function runMatrixCase(page, spec) {
  await page.evaluate(
    ({ kind, count, labels, labelOffset, values }) => {
      const root = document.querySelector("#fixture");
      root.replaceChildren();
      const row = document.createElement("slex-row");
      row.id = "matrix-row";
      for (let index = 0; index < count; index += 1) {
        const label = labels[(index + labelOffset) % labels.length];
        if (kind === "stat") {
          const stat = document.createElement("slex-stat");
          stat.id = `matrix-stat-${index}`;
          stat.label = label.value;
          stat.dataset.labelKind = label.kind;
          stat.value = values[index % values.length];
          stat.unit = ["mV", "V", "A", "Hz"][index % 4];
          row.append(stat);
        } else {
          const card = document.createElement("slex-card");
          card.id = `matrix-card-${index}`;
          card.title = label.value;
          card.dataset.labelKind = label.kind;
          const input = document.createElement("slex-input");
          const inputLabel = labels[(index + labelOffset + 1) % labels.length];
          input.id = `matrix-input-${index}`;
          input.label = inputLabel.value;
          input.type = "engineering";
          input.value = `${index + 1}.250`;
          input.unit = "mV";
          card.append(input);
          if (index % 3 === 1) {
            const note = document.createElement("p");
            note.textContent = "A longer ordinary HTML note checks equal Card height while preserving native slotted content.";
            card.append(note);
          }
          row.append(card);
        }
      }
      root.append(row);
    },
    {
      kind: spec.kind,
      count: spec.count,
      labels: labelEntries.map(([kind, value]) => ({ kind, value })),
      labelOffset: spec.labelOffset,
      values: numericValues,
    },
  );
  await waitForBalanced(page, "#matrix-row", spec.count);
  await settle(page);
  if (spec.blockFonts) await page.waitForTimeout(150);
  const measurement = await measureBalancedRow(page, "#matrix-row");
  const validated = validateBalancedGeometry(measurement, spec.count, spec.id);
  const failures = [...validated.failures];
  if (spec.blockFonts) failures.push(...violation(measurement.items.every(item => item.fontFamily.includes("BlockedComponentFont")), `${spec.id}: components must actually inherit the blocked host web font`, measurement.items));
  failures.push(...violation(measurement.direction === (spec.direction || "ltr"), `${spec.id}: component layout must inherit initial direction`, measurement.direction));
  if (spec.deviceScaleFactor === 2) {
    failures.push(...violation(Math.abs(await page.evaluate(() => devicePixelRatio) - 2) <= 0.01, `${spec.id}: high-DPI emulation must report DPR 2`));
  }
  return {
    failures,
    evidence: {
      matrix: { width: spec.viewport.width, theme: spec.theme, count: spec.count, kind: spec.kind },
      labels: [...new Set(measurement.items.map((item) => documentLabelKind(item.id, spec)))],
      geometry: { ...measurement, rows: validated.rows },
      evidenceMode: spec.deviceScaleFactor === 2 ? "Playwright deviceScaleFactor emulation; not physical device proof" : "CSS pixel viewport",
      fontMode: spec.blockFonts ? "host web font inherited by components blocked; native font fallback measured" : "normal local font resolution",
    },
  };
}

function documentLabelKind(id, spec) {
  const match = id.match(/-(\d+)$/);
  const index = match ? Number(match[1]) : 0;
  return labelEntries[(index + spec.labelOffset) % labelEntries.length][0];
}

async function runNestedContractCase(page, spec) {
  await page.evaluate(({ labels }) => {
    const root = document.querySelector("#fixture");
    root.replaceChildren();

    const grid = document.createElement("slex-grid");
    grid.id = "nested-grid";
    grid.columns = 2;
    grid.gap = "16px";

    const outerCard = document.createElement("slex-card");
    outerCard.id = "nested-outer-card";
    outerCard.title = "Row nested inside Card";
    const cardRow = document.createElement("slex-row");
    cardRow.id = "nested-in-card";
    for (let index = 0; index < 3; index += 1) {
      const stat = document.createElement("slex-stat");
      stat.id = `nested-card-stat-${index}`;
      stat.label = labels[index % labels.length];
      stat.value = [3.1415926535, 12000.125, -0.00098765][index];
      stat.unit = "mV";
      cardRow.append(stat);
    }
    outerCard.append(cardRow);

    const gridRow = document.createElement("slex-row");
    gridRow.id = "nested-in-grid";
    for (let index = 0; index < 5; index += 1) {
      const card = document.createElement("slex-card");
      card.id = `nested-grid-card-${index}`;
      card.title = labels[index % labels.length];
      const input = document.createElement("slex-input");
      input.label = labels[(index + 1) % labels.length];
      input.value = `${index + 1}.0`;
      input.unit = "mV";
      card.append(input);
      gridRow.append(card);
    }
    grid.append(outerCard, gridRow);

    const explicit = document.createElement("slex-row");
    explicit.id = "explicit-row";
    explicit.align = "start";
    explicit.justify = "space-between";
    for (let index = 0; index < 2; index += 1) {
      const stat = document.createElement("slex-stat");
      stat.id = `author-width-${index}`;
      stat.style.width = "148px";
      stat.label = `Author width ${index + 1}`;
      stat.value = Math.PI + index;
      stat.unit = "mV";
      explicit.append(stat);
    }
    root.append(grid, explicit);
  }, { labels: Object.values(labels) });

  await waitForBalanced(page, "#nested-in-card", 3);
  await waitForBalanced(page, "#nested-in-grid", 5);
  await settle(page);
  const cardRow = await measureBalancedRow(page, "#nested-in-card");
  const gridRow = await measureBalancedRow(page, "#nested-in-grid");
  const cardValidated = validateBalancedGeometry(cardRow, 3, `${spec.id}/Row-in-Card`);
  const gridValidated = validateBalancedGeometry(gridRow, 5, `${spec.id}/Row-in-Grid`);
  const contracts = await page.evaluate(() => {
    const gridHost = document.querySelector("#nested-grid");
    const grid = gridHost.shadowRoot.querySelector(".slex-grid");
    const gridRect = grid.getBoundingClientRect();
    const gridStyle = getComputedStyle(grid);
    const explicitHost = document.querySelector("#explicit-row");
    const explicit = explicitHost.shadowRoot.querySelector(".slex-row");
    const explicitStyle = getComputedStyle(explicit);
    const authored = [...explicitHost.children].map((child) => ({
      id: child.id,
      width: child.getBoundingClientRect().width,
      marker: child.getAttribute("data-slex-balanced-tile"),
      gridColumn: child.style.gridColumn,
    }));
    return {
      grid: {
        display: gridStyle.display,
        columns: gridStyle.gridTemplateColumns.split(/\s+/).filter(Boolean),
        gap: Number.parseFloat(gridStyle.columnGap),
        left: gridRect.left,
        right: gridRect.right,
      },
      explicit: {
        display: explicitStyle.display,
        balanced: explicit.classList.contains("slex-row--balanced-tiles"),
        alignItems: explicitStyle.alignItems,
        justifyContent: explicitStyle.justifyContent,
        authored,
      },
      pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
  });
  const failures = [...cardValidated.failures, ...gridValidated.failures];
  failures.push(...violation(contracts.grid.display === "grid" && contracts.grid.columns.length === 2, `${spec.id}: declared Grid columns must be respected at desktop width`, contracts.grid));
  failures.push(...violation(contracts.explicit.display === "flex" && !contracts.explicit.balanced, `${spec.id}: explicit align/justify must retain ordinary Row layout`, contracts.explicit));
  failures.push(...violation(["start", "flex-start"].includes(contracts.explicit.alignItems), `${spec.id}: explicit align must be preserved`, contracts.explicit));
  failures.push(...violation(contracts.explicit.justifyContent === "space-between", `${spec.id}: explicit justify must be preserved`, contracts.explicit));
  failures.push(...violation(contracts.explicit.authored.every((item) => Math.abs(item.width - 148) <= 1 && item.marker === null && item.gridColumn === ""), `${spec.id}: author-defined widths must remain 148 CSS px without balancing markers`, contracts.explicit.authored));
  failures.push(...violation(contracts.pageOverflow <= 1, `${spec.id}: nested and explicit layouts must not overflow the page`, contracts.pageOverflow));
  return {
    failures,
    evidence: {
      rowInCard: { ...cardRow, rows: cardValidated.rows },
      rowInGrid: { ...gridRow, rows: gridValidated.rows },
      contracts,
      assertionBoundary: "Explicit align/justify and authored widths are checked as authored flex behavior, not forced through automatic balancing assertions.",
    },
  };
}

async function runZoomCase(page, spec) {
  await page.evaluate(() => {
    const root = document.querySelector("#fixture");
    root.replaceChildren();
    for (const zoom of [1, 1.25, 2]) {
      const stage = document.createElement("section");
      stage.className = "zoom-stage";
      stage.id = `zoom-stage-${String(zoom).replace(".", "-")}`;
      stage.style.zoom = String(zoom);
      const stat = document.createElement("slex-stat");
      stat.id = `zoom-stat-${String(zoom).replace(".", "-")}`;
      stat.style.width = "148px";
      stat.label = `Fixed 148 CSS px at zoom ${zoom}`;
      stat.value = Math.PI;
      stat.unit = "mV";
      stage.append(stat);
      const row = document.createElement("slex-row");
      row.id = `zoom-row-${String(zoom).replace(".", "-")}`;
      row.style.width = "480px";
      for (let index = 0; index < 5; index++) {
        const tile = document.createElement("slex-stat");
        tile.label = `Zoom metric ${index + 1}`; tile.value = Math.PI; tile.unit = "V"; row.append(tile);
      }
      stage.append(row);
      root.append(stage);
    }
  });
  await page.waitForFunction(() => [...document.querySelectorAll("[id^=zoom-stat-]")].every((host) => {
    const value = host.shadowRoot?.querySelector(".slex-stat-value");
    return value && Number.parseFloat(getComputedStyle(value).fontSize) >= 20;
  }));
  await settle(page, 180);
  const measurements = await page.evaluate(() => [...document.querySelectorAll("[id^=zoom-stat-]")].map((host) => {
    const stage = host.parentElement;
    const value = host.shadowRoot.querySelector(".slex-stat-value");
    const number = host.shadowRoot.querySelector(".slex-stat-number");
    const unit = host.shadowRoot.querySelector(".slex-stat-unit");
    const hostRect = host.getBoundingClientRect();
    const valueRect = value.getBoundingClientRect();
    const unitRect = unit.getBoundingClientRect();
    return {
      cssZoom: Number.parseFloat(getComputedStyle(stage).zoom) || 1,
      hostClientWidth: host.clientWidth,
      hostRectWidth: hostRect.width,
      valueClientWidth: value.clientWidth,
      valueRectWidth: valueRect.width,
      unitClientWidth: unit.clientWidth,
      unitRectWidth: unitRect.width,
      fontSize: Number.parseFloat(getComputedStyle(value).fontSize),
      display: number.textContent,
      unit: unit.textContent,
      numberClipped: number.scrollWidth > number.clientWidth + 1,
    };
  }));
  const failures = [];
  const rows = await page.locator("slex-row[id^=zoom-row-]").evaluateAll(elements => elements.map(row => {
    const zoom = Number.parseFloat(getComputedStyle(row.parentElement).zoom) || 1;
    const layout = row.shadowRoot.querySelector(".slex-row");
    const items = [...row.children].map(tile => {
      const box = tile.getBoundingClientRect(), number = tile.shadowRoot.querySelector(".slex-stat-number");
      return { left: box.left / zoom, right: box.right / zoom, top: box.top / zoom, width: box.width / zoom, display: number.textContent, clipped: number.scrollWidth > number.clientWidth + 1 };
    });
    return { zoom, cssWidth: layout.clientWidth, columns: getComputedStyle(layout).getPropertyValue("--slex-balanced-cols").trim(), items };
  }));
  failures.push(...violation(rows.length === 3 && rows.every(row => row.cssWidth === 480), `${spec.id}: Row keeps its fixed CSS width under zoom`, rows));
  failures.push(...violation(rows.every(row => row.columns === "3"), `${spec.id}: five tiles in 480 CSS px retain a 3+2 balanced layout under zoom`, rows));
  failures.push(...violation(rows.every(row => row.items.every((tile, index) => !tile.clipped && tile.display === rows[0].items[index].display && Math.abs(tile.width - rows[0].items[index].width) <= 1)), `${spec.id}: Row tile widths and precision are invariant in CSS pixels`, rows));
  failures.push(...violation(maxSpread(measurements.map((entry) => entry.hostClientWidth)) <= 1, `${spec.id}: fixed host CSS width must remain invariant across CSS zoom`, measurements));
  failures.push(...violation(maxSpread(measurements.map((entry) => entry.valueClientWidth)) <= 1, `${spec.id}: available value CSS width must remain invariant across CSS zoom`, measurements));
  failures.push(...violation(maxSpread(measurements.map((entry) => entry.fontSize)) <= 0.01, `${spec.id}: computed CSS font size must remain invariant across CSS zoom`, measurements));
  failures.push(...violation(new Set(measurements.map((entry) => entry.display)).size === 1, `${spec.id}: numeric display precision must not change when CSS width and font stay constant`, measurements));
  failures.push(...violation(measurements.every((entry) => entry.unit === "mV"), `${spec.id}: fixed-width numeric card must keep the mV unit`, measurements));
  failures.push(...violation(measurements.every((entry) => !entry.numberClipped), `${spec.id}: fixed-width finite number must not clip`, measurements));
  failures.push(...violation(measurements.every((entry) => Math.abs(entry.hostRectWidth / entry.hostClientWidth - entry.cssZoom) <= 0.03), `${spec.id}: bounding boxes must reflect the labelled CSS zoom factor`, measurements));
  const pageOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  failures.push(...violation(pageOverflow <= 1, `${spec.id}: CSS zoom fixture must not overflow the page`, pageOverflow));
  return {
    failures,
    evidence: {
      measurements,
      zoomedRows: rows,
      pageOverflow,
      evidenceMode: "CSS zoom 1/1.25/2 only; not OS zoom, browser UI zoom, or physical-device proof.",
      mixedUnitGuard: "Display must be invariant because clientWidth and computed font size stay in CSS pixels while getBoundingClientRect scales.",
    },
  };
}

async function visibilityEvidence(page, selector) {
  return page.locator(selector).evaluate((host) => {
    const rect = host.getBoundingClientRect();
    const inner = host.shadowRoot?.querySelector(".slex-stat,.slex-card");
    const innerRect = inner?.getBoundingClientRect();
    return {
      selector: `#${host.id}`,
      hiddenAttribute: host.hidden,
      className: host.className,
      display: getComputedStyle(host).display,
      clientRects: host.getClientRects().length,
      width: rect.width,
      height: rect.height,
      innerWidth: innerRect?.width || 0,
      innerHeight: innerRect?.height || 0,
      offsetParent: !!host.offsetParent,
    };
  });
}

function validateInvisible(evidence, label) {
  return violation(
    evidence.display === "none" && evidence.clientRects === 0 && evidence.width === 0 && evidence.height === 0 && evidence.innerWidth === 0 && evidence.innerHeight === 0 && !evidence.offsetParent,
    `${label}: hidden component must be actually invisible`,
    evidence,
  );
}

async function runDynamicCase(page, spec) {
  await page.evaluate(({ labels, values }) => {
    const root = document.querySelector("#fixture");
    root.replaceChildren();

    const hiddenParent = document.createElement("section");
    hiddenParent.id = "initially-hidden-parent";
    hiddenParent.className = "fixture-section";
    hiddenParent.hidden = true;
    const statRow = document.createElement("slex-row");
    statRow.id = "dynamic-stats";
    for (let index = 0; index < 5; index += 1) {
      const stat = document.createElement("slex-stat");
      stat.id = `dynamic-stat-${index}`;
      stat.label = labels[index % labels.length];
      stat.value = values[index];
      stat.unit = "mV";
      if (index === 1) stat.hidden = true;
      if (index === 2) stat.classList.add("fixture-hidden");
      statRow.append(stat);
    }
    hiddenParent.append(statRow);

    const cardSection = document.createElement("section");
    cardSection.className = "fixture-section";
    const rowA = document.createElement("slex-row");
    rowA.id = "dynamic-row-a";
    const rowB = document.createElement("slex-row");
    rowB.id = "dynamic-row-b";
    for (let index = 0; index < 5; index += 1) {
      const card = document.createElement("slex-card");
      card.id = index === 0 ? "focus-card" : `dynamic-card-${index}`;
      card.title = `Dynamic card ${index + 1}`;
      const input = document.createElement("slex-input");
      input.id = index === 0 ? "focus-input" : `dynamic-input-${index}`;
      input.label = labels[(index + 1) % labels.length];
      input.value = `${index + 1}.000`;
      input.unit = "mV";
      card.append(input);
      (index < 3 ? rowA : rowB).append(card);
    }
    cardSection.append(rowA, rowB);
    root.append(hiddenParent, cardSection);
  }, { labels: Object.values(labels), values: numericValues });
  await waitForBalanced(page, "#dynamic-row-a", 3);
  await waitForBalanced(page, "#dynamic-row-b", 2);
  await settle(page);

  const failures = [];
  const hiddenParentEvidence = await page.locator("#initially-hidden-parent").evaluate((parent) => {
    const row = parent.querySelector("slex-row");
    const rect = row.getBoundingClientRect();
    return { parentDisplay: getComputedStyle(parent).display, rowWidth: rect.width, rowHeight: rect.height, rowClientRects: row.getClientRects().length };
  });
  failures.push(...violation(hiddenParentEvidence.parentDisplay === "none" && hiddenParentEvidence.rowWidth === 0 && hiddenParentEvidence.rowHeight === 0 && hiddenParentEvidence.rowClientRects === 0, `${spec.id}: initially hidden parent must suppress child layout`, hiddenParentEvidence));

  await page.evaluate(() => { document.querySelector("#initially-hidden-parent").hidden = false; });
  await waitForBalanced(page, "#dynamic-stats", 3);
  await settle(page);
  const nativeHidden = await visibilityEvidence(page, "#dynamic-stat-1");
  const classHidden = await visibilityEvidence(page, "#dynamic-stat-2");
  failures.push(...validateInvisible(nativeHidden, `${spec.id}/native hidden`));
  failures.push(...validateInvisible(classHidden, `${spec.id}/class display:none`));
  const shownWithHiddenTiles = await measureBalancedRow(page, "#dynamic-stats");
  const shownValidation = validateBalancedGeometry(shownWithHiddenTiles, 3, `${spec.id}/shown parent`);
  failures.push(...shownValidation.failures);

  await page.evaluate(() => {
    document.querySelector("#dynamic-stat-1").hidden = false;
    document.querySelector("#dynamic-stat-2").classList.remove("fixture-hidden");
  });
  await waitForBalanced(page, "#dynamic-stats", 5);
  await settle(page);
  const revealed = await measureBalancedRow(page, "#dynamic-stats");
  const revealedValidation = validateBalancedGeometry(revealed, 5, `${spec.id}/revealed tiles`);
  failures.push(...revealedValidation.failures);

  await page.evaluate(() => {
    const stat = document.querySelector("#dynamic-stat-0");
    const focusInput = document.querySelector("#focus-input");
    window.__layoutRefs = {
      statHost: stat,
      statNumber: stat.shadowRoot.querySelector(".slex-stat-number"),
      focusCard: document.querySelector("#focus-card"),
      inputHost: focusInput,
      inputNode: focusInput.shadowRoot.querySelector("input"),
    };
    stat.label = "Updated 温度 compensated label";
    stat.unit = "µV";
    stat.value = 98765.4321;
  });
  await settle(page, 180);
  const updates = await page.evaluate(() => {
    const stat = document.querySelector("#dynamic-stat-0");
    return {
      label: stat.shadowRoot.querySelector(".slex-stat-label span").textContent,
      unit: stat.shadowRoot.querySelector(".slex-stat-unit").textContent,
      valueTitle: stat.shadowRoot.querySelector(".slex-stat-value").title,
      hostIdentity: stat === window.__layoutRefs.statHost,
      numberIdentity: stat.shadowRoot.querySelector(".slex-stat-number") === window.__layoutRefs.statNumber,
    };
  });
  failures.push(...violation(updates.label === "Updated 温度 compensated label" && updates.unit === "µV" && updates.valueTitle === "98765.4321 µV", `${spec.id}: live label/unit/value updates must render`, updates));
  failures.push(...violation(updates.hostIdentity && updates.numberIdentity, `${spec.id}: unrelated live Stat updates must retain host and number node identity`, updates));

  const nativeInput = page.locator("#focus-input").locator("input");
  await nativeInput.focus();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type("42.750");
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.up("Shift");
  const keyboardState = await nativeInput.evaluate((input) => ({
    value: input.value,
    selectionStart: input.selectionStart,
    selectionEnd: input.selectionEnd,
  }));
  failures.push(...violation(keyboardState.value === "42.750" && keyboardState.selectionStart === 4 && keyboardState.selectionEnd === 6, `${spec.id}: keyboard input and selection setup must succeed`, keyboardState));

  await page.setViewportSize({ width: 390, height: 1000 });
  await page.evaluate(() => {
    const row = document.querySelector("#dynamic-row-a");
    row.prepend(document.querySelector("#dynamic-card-2"));
  });
  await waitForBalanced(page, "#dynamic-row-a", 3);
  await settle(page);
  const focusAfterResizeReorder = await page.evaluate(({ selectionStart, selectionEnd }) => {
    const refs = window.__layoutRefs;
    const currentHost = document.querySelector("#focus-input");
    const currentInput = currentHost.shadowRoot.querySelector("input");
    return {
      hostIdentity: currentHost === refs.inputHost,
      nodeIdentity: currentInput === refs.inputNode,
      documentFocus: document.activeElement === currentHost,
      shadowFocus: currentHost.shadowRoot.activeElement === currentInput,
      value: currentInput.value,
      selectionStart: currentInput.selectionStart,
      selectionEnd: currentInput.selectionEnd,
      expectedSelectionStart: selectionStart,
      expectedSelectionEnd: selectionEnd,
    };
  }, keyboardState);
  failures.push(...violation(
    focusAfterResizeReorder.hostIdentity && focusAfterResizeReorder.nodeIdentity && focusAfterResizeReorder.documentFocus && focusAfterResizeReorder.shadowFocus && focusAfterResizeReorder.value === "42.750" && focusAfterResizeReorder.selectionStart === keyboardState.selectionStart && focusAfterResizeReorder.selectionEnd === keyboardState.selectionEnd,
    `${spec.id}: resize and sibling reorder must retain native input identity, focus, value, and selection`,
    focusAfterResizeReorder,
  ));

  await page.evaluate(() => {
    const row = document.querySelector("#dynamic-stats");
    row.append(row.firstElementChild);
    document.querySelector("#dynamic-stat-4").remove();
    const added = document.createElement("slex-stat");
    added.id = "dynamic-stat-added";
    added.label = "Added after removal";
    added.value = 12.3456;
    added.unit = "mV";
    row.append(added);
  });
  await waitForBalanced(page, "#dynamic-stats", 5);
  await settle(page);
  const mutatedStats = await measureBalancedRow(page, "#dynamic-stats");
  const mutatedValidation = validateBalancedGeometry(mutatedStats, 5, `${spec.id}/remove-add-reorder`);
  failures.push(...mutatedValidation.failures);
  const statIdentityAfterReorder = await page.evaluate(() => {
    const refs = window.__layoutRefs;
    return refs.statHost.shadowRoot.querySelector(".slex-stat-number") === refs.statNumber;
  });
  failures.push(...violation(statIdentityAfterReorder, `${spec.id}: retained Stat node must keep identity after reorder`));

  await page.evaluate(() => {
    document.querySelector("#dynamic-row-b").append(document.querySelector("#focus-card"));
  });
  await waitForBalanced(page, "#dynamic-row-a", 2);
  await waitForBalanced(page, "#dynamic-row-b", 3);
  await settle(page);
  const moveIdentity = await page.evaluate(() => {
    const refs = window.__layoutRefs;
    const inputHost = document.querySelector("#focus-input");
    const inputNode = inputHost.shadowRoot.querySelector("input");
    return {
      inDestination: document.querySelector("#dynamic-row-b").contains(refs.focusCard),
      cardIdentity: document.querySelector("#focus-card") === refs.focusCard,
      hostIdentity: inputHost === refs.inputHost,
      inputIdentity: inputNode === refs.inputNode,
      value: inputNode.value,
    };
  });
  failures.push(...violation(moveIdentity.inDestination && moveIdentity.cardIdentity && moveIdentity.hostIdentity && moveIdentity.inputIdentity && moveIdentity.value === "42.750", `${spec.id}: same-turn move between Rows must retain Card/input nodes and value`, moveIdentity));

  await page.evaluate(() => {
    document.querySelector("#dynamic-card-1").remove();
  });
  await settle(page);
  await page.evaluate(() => {
    const card = document.createElement("slex-card");
    card.id = "dynamic-card-added";
    card.title = "Added native Card";
    const input = document.createElement("slex-input");
    input.label = "Added input";
    input.value = "9.500";
    card.append(input);
    document.querySelector("#dynamic-row-a").append(card);
  });
  await waitForBalanced(page, "#dynamic-row-a", 2);
  await settle(page);
  const rowA = await measureBalancedRow(page, "#dynamic-row-a");
  const rowB = await measureBalancedRow(page, "#dynamic-row-b");
  const rowAValidation = validateBalancedGeometry(rowA, 2, `${spec.id}/Row-A-final`);
  const rowBValidation = validateBalancedGeometry(rowB, 3, `${spec.id}/Row-B-final`);
  failures.push(...rowAValidation.failures, ...rowBValidation.failures);
  const finalOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  failures.push(...violation(finalOverflow <= 1, `${spec.id}: dynamic scenario must not overflow after resize and mutations`, finalOverflow));

  return {
    failures,
    evidence: {
      initiallyHiddenParent: hiddenParentEvidence,
      hiddenTiles: { nativeHidden, classHidden },
      shownWithHiddenTiles: { ...shownWithHiddenTiles, rows: shownValidation.rows },
      revealed: { ...revealed, rows: revealedValidation.rows },
      updates,
      keyboardState,
      focusAfterResizeReorder,
      removeAddReorder: { ...mutatedStats, rows: mutatedValidation.rows, statIdentityAfterReorder },
      crossRowMove: moveIdentity,
      finalRows: {
        rowA: { ...rowA, rows: rowAValidation.rows },
        rowB: { ...rowB, rows: rowBValidation.rows },
      },
      finalOverflow,
    },
  };
}

function matrixCases() {
  const widths = [280, 320, 390, 768, 1024, 1440];
  const counts = [2, 3, 5, 7, 8, 11];
  const cases = [];
  for (const [themeIndex, theme] of ["light", "dark"].entries()) {
    for (const [index, width] of widths.entries()) {
      const kind = (index + themeIndex) % 2 === 0 ? "stat" : "card";
      const direction = (width === 390 && theme === "light") || (width === 768 && theme === "dark") ? "rtl" : "ltr";
      const deviceScaleFactor = (width === 390 && theme === "dark") || (width === 1024 && theme === "light") ? 2 : 1;
      const blockFonts = (width === 320 && theme === "dark") || (width === 1024 && theme === "light");
      cases.push({
        id: `matrix-${width}-${theme}-${kind}-${counts[index]}`,
        category: "representative-matrix",
        viewport: { width, height: 1000 },
        theme,
        direction,
        deviceScaleFactor,
        blockFonts,
        kind,
        count: counts[index],
        labelOffset: (index + themeIndex) % labelEntries.length,
        captureOnPass: width === 390 && theme === "dark",
      });
    }
  }
  return cases;
}

const browserTargets = [
  { id: "playwright-chromium", browserType: chromium, required: true, launchOptions: {} },
  { id: "playwright-firefox", browserType: firefox, required: true, launchOptions: {} },
  { id: "playwright-webkit", browserType: webkit, required: true, launchOptions: {} },
  { id: "installed-chrome", browserType: chromium, required: false, launchOptions: { channel: "chrome" } },
  { id: "installed-edge", browserType: chromium, required: false, launchOptions: { channel: "msedge" } },
];

async function runBrowserTarget(target) {
  const browserEntry = {
    id: target.id,
    required: target.required,
    launchOptions: target.launchOptions,
    status: "launching",
    version: null,
  };
  report.browsers.push(browserEntry);
  let browser;
  try {
    browser = await target.browserType.launch({ ...target.launchOptions, timeout: 10000 });
    activeBrowsers.add(browser);
    browserEntry.version = browser.version();
    browserEntry.status = "running";
  } catch (error) {
    const missing = /executable doesn't exist|distribution .+ not found|browser is not installed/i.test(error.message);
    browserEntry.status = !target.required && missing ? "skipped" : "failed";
    browserEntry.reason = missing ? "Browser executable is not installed" : "Browser launch failed";
    browserEntry.error = errorRecord(error);
    return;
  }

  try {
    for (const spec of matrixCases()) await executeCase(browser, browserEntry, spec, runMatrixCase);
    await executeCase(browser, browserEntry, {
      id: "nested-grid-card-explicit-contracts",
      category: "nested-and-authored-contracts",
      viewport: { width: 1024, height: 1200 },
      theme: "dark",
      direction: "rtl",
      deviceScaleFactor: 1,
      captureOnPass: false,
    }, runNestedContractCase);
    await executeCase(browser, browserEntry, {
      id: "fixed-width-css-zoom",
      category: "css-zoom-mixed-unit-guard",
      viewport: { width: 1024, height: 1100 },
      theme: "light",
      direction: "ltr",
      deviceScaleFactor: 1,
      captureOnPass: true,
    }, runZoomCase);
    await executeCase(browser, browserEntry, {
      id: "dynamic-layout-and-identity",
      category: "dynamic-lifecycle",
      viewport: { width: 768, height: 1400 },
      theme: "dark",
      direction: "ltr",
      deviceScaleFactor: 1,
      captureOnPass: true,
    }, runDynamicCase);
    const ownCases = report.cases.filter((entry) => entry.browser === target.id);
    browserEntry.status = ownCases.some((entry) => entry.status === "failed") ? "completed-with-failures" : "passed";
    browserEntry.caseSummary = {
      total: ownCases.length,
      passed: ownCases.filter((entry) => entry.status === "passed").length,
      failed: ownCases.filter((entry) => entry.status === "failed").length,
    };
  } finally {
    activeBrowsers.delete(browser);
    try {
      await browser.close();
      browserEntry.closed = true;
    } catch (error) {
      browserEntry.closed = false;
      report.cleanupFailures.push({ target: target.id, resource: "browser", error: errorRecord(error) });
    }
  }
}

try {
  report.artifactIntegrity.start = await artifactHashes();
  await startServer();
  for (const target of browserTargets) await runBrowserTarget(target);
} catch (error) {
  topLevelFailure = error;
  report.topLevelFailure = errorRecord(error);
} finally {
  for (const browser of activeBrowsers) {
    try {
      await browser.close();
    } catch (error) {
      report.cleanupFailures.push({ target: "top-level", resource: "browser", error: errorRecord(error) });
    }
  }
  activeBrowsers.clear();
  if (server) {
    try {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      report.server.stopped = true;
    } catch (error) {
      report.cleanupFailures.push({ target: "top-level", resource: "fixture-server", error: errorRecord(error) });
    }
  }
  try {
    report.artifactIntegrity.end = await artifactHashes();
    report.artifactIntegrity.unchanged = JSON.stringify(report.artifactIntegrity.start) === JSON.stringify(report.artifactIntegrity.end);
    if (!report.artifactIntegrity.unchanged) {
      report.integrityFailure = {
        message: "Frozen built artifact hashes changed during the suite",
        start: report.artifactIntegrity.start,
        end: report.artifactIntegrity.end,
      };
    }
  } catch (error) {
    report.artifactIntegrity.unchanged = false;
    report.artifactIntegrity.error = errorRecord(error);
  }

  const failedCases = report.cases.filter((entry) => entry.status === "failed");
  const requiredBrowserFailures = report.browsers.filter((entry) => entry.required && entry.status === "failed");
  const browserLaunchFailures = report.browsers.filter((entry) => entry.status === "failed");
  report.finishedAt = new Date().toISOString();
  report.summary = {
    totalCases: report.cases.length,
    passedCases: report.cases.filter((entry) => entry.status === "passed").length,
    failedCases: failedCases.length,
    functionalFailures: failedCases.filter((entry) => entry.failureKind === "functional").length,
    harnessFailures: failedCases.filter((entry) => entry.failureKind === "harness").length,
    browserSkips: report.browsers.filter((entry) => entry.status === "skipped").length,
    requiredBrowserFailures: requiredBrowserFailures.length,
    browserLaunchFailures: browserLaunchFailures.length,
    cleanupFailures: report.cleanupFailures.length,
  };
  report.passed = !topLevelFailure
    && report.artifactIntegrity.unchanged === true
    && failedCases.length === 0
    && requiredBrowserFailures.length === 0
    && browserLaunchFailures.length === 0
    && report.cleanupFailures.length === 0;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

const consoleSummary = {
  passed: report.passed,
  report: relativePath(reportPath),
  artifactIntegrity: report.artifactIntegrity,
  browsers: report.browsers.map(({ id, required, status, version, reason, caseSummary, error }) => ({
    id,
    required,
    status,
    version,
    reason,
    caseSummary,
    error: error?.message,
  })),
  summary: report.summary,
  failures: report.cases
    .filter((entry) => entry.status === "failed")
    .map((entry) => ({ id: entry.id, kind: entry.failureKind, message: entry.error?.message, details: entry.error?.details, screenshot: entry.failureScreenshot })),
  topLevelFailure: report.topLevelFailure,
  cleanupFailures: report.cleanupFailures,
};
console.log(JSON.stringify(consoleSummary, null, 2));
if (!report.passed) process.exitCode = 1;
