import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const name = process.argv[2] ?? "chromium";
const engine = { chromium, firefox, webkit }[name];
if (!engine) throw new Error(`Unknown browser ${name}`);
const output = new URL(`../../test-results/html-migration/${name}/`, import.meta.url);
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), "slexkit-animation-"));
const bundle = join(temporary, "animation.js");

await new Promise((resolveBuild, rejectBuild) => {
  execFile(
    process.platform === "win32" ? "bun.exe" : "bun",
    ["build", "src/engine/animation.ts", "--target=browser", "--format=esm", `--outfile=${bundle}`],
    { cwd: new URL("../../", import.meta.url), windowsHide: true },
    (error, stdout, stderr) =>
      error ? rejectBuild(new Error(`${error.message}\n${stdout}\n${stderr}`)) : resolveBuild(),
  );
});

const server = http.createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  response.setHeader("cache-control", "no-store");
  if (path === "/host") {
    response.setHeader("content-type", "text/html");
    response.end("<!doctype html><main><iframe id='fixture' src='/frame'></iframe></main>");
  } else if (path === "/frame") {
    response.setHeader("content-type", "text/html");
    response.end("<!doctype html><div id='root'></div>");
  } else if (path === "/animation.js") {
    response.setHeader("content-type", "text/javascript");
    response.end(await readFile(bundle));
  } else {
    response.statusCode = 404;
    response.end("missing");
  }
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const origin = `http://127.0.0.1:${server.address().port}`;
const browserServer = await engine.launchServer({ headless: true });
console.log(JSON.stringify({ browserPid: browserServer.process().pid, name }));
const browser = await engine.connect(browserServer.wsEndpoint());
const report = { browser: name, version: browser.version(), checks: [], error: null };

async function frameFor(page) {
  await page.goto(`${origin}/host`);
  const frame = page.frames().find((candidate) => candidate.url().endsWith("/frame"));
  assert.ok(frame, "HTML fixture iframe should load");
  return frame;
}

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  let frame = await frameFor(page);
  const ended = await frame.evaluate(async () => {
    const { runCssAnimation, enterAnimationOptions } = await import("/animation.js");
    const style = document.createElement("style");
    style.textContent =
      "@keyframes live{from{opacity:.9}to{opacity:1}} .live{animation:live 30s linear paused}";
    document.head.append(style);
    const node = document.createElement("div");
    document.querySelector("#root").append(node);
    let events = 0;
    node.addEventListener("animationend", () => events++);
    const done = new Promise((resolve) =>
      runCssAnimation(node, "live", resolve, enterAnimationOptions),
    );
    node.dispatchEvent(new AnimationEvent("animationend", { animationName: "live" }));
    await done;
    return { events, classRemoved: !node.classList.contains("live") };
  });
  assert.deepEqual(ended, { events: 1, classRemoved: true });
  report.checks.push("browser AnimationEvent animationend completes imported animation utility");

  const cancelled = await frame.evaluate(async () => {
    const { runCssAnimation, enterAnimationOptions } = await import("/animation.js");
    const style = document.createElement("style");
    style.textContent =
      "@keyframes cancelme{from{opacity:.2}to{opacity:1}} .cancelme{animation:cancelme 30s linear}";
    document.head.append(style);
    const node = document.createElement("div");
    document.querySelector("#root").append(node);
    let finishes = 0;
    const done = new Promise((resolve) =>
      runCssAnimation(
        node,
        "cancelme",
        () => {
          finishes++;
          resolve();
        },
        enterAnimationOptions,
      ),
    );
    node.dispatchEvent(new AnimationEvent("animationcancel", { animationName: "cancelme" }));
    await done;
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { finishes, classRemoved: !node.classList.contains("cancelme") };
  });
  assert.deepEqual(cancelled, { finishes: 1, classRemoved: true });
  report.checks.push("browser AnimationEvent animationcancel finishes once");

  await page.emulateMedia({ reducedMotion: "reduce" });
  frame = await frameFor(page);
  const reduced = await frame.evaluate(async () => {
    const { runCssAnimation, enterAnimationOptions } = await import("/animation.js");
    const style = document.createElement("style");
    style.textContent =
      "@keyframes reduced{from{opacity:.2}to{opacity:1}} .reduced{animation:reduced 30s linear}";
    document.head.append(style);
    const node = document.createElement("div");
    document.querySelector("#root").append(node);
    let synchronous = false;
    runCssAnimation(
      node,
      "reduced",
      () => {
        synchronous = true;
      },
      enterAnimationOptions,
    );
    return {
      synchronous,
      classRemoved: !node.classList.contains("reduced"),
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });
  assert.deepEqual(reduced, { synchronous: true, classRemoved: true, reduced: true });
  report.checks.push("reduced motion completes synchronously and removes enter class");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  frame = await frameFor(page);
  const disposal = await frame.evaluate(async () => {
    const { runCssAnimation, leaveAnimationOptions } = await import("/animation.js");
    const style = document.createElement("style");
    style.textContent =
      "@keyframes forever{from{opacity:.2}to{opacity:1}} .forever{animation:forever 1s linear infinite}";
    document.head.append(style);
    const node = document.createElement("div");
    document.querySelector("#root").append(node);
    let finishes = 0;
    const dispose = runCssAnimation(node, "forever", () => finishes++, leaveAnimationOptions);
    dispose();
    dispose();
    return { finishes, classRetained: node.classList.contains("forever") };
  });
  assert.deepEqual(disposal, { finishes: 1, classRetained: true });
  await page.locator("#fixture").evaluate((node) => node.remove());
  assert.equal(page.frames().length, 1);
  report.checks.push(
    "host disposal interrupts infinite animation once and removes the HTML iframe",
  );
  report.status = "passed";
  console.log(`${name}: ${report.checks.length} imported animation/HTML iframe checks passed`);
} catch (error) {
  report.status = "failed";
  report.error = String(error?.stack ?? error);
  process.exitCode = 1;
  console.error(error);
} finally {
  await writeFile(
    new URL("animations-report.json", output),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await browser.close();
  await browserServer.close();
  await new Promise((resolveClose, rejectClose) =>
    server.close((error) => (error ? rejectClose(error) : resolveClose())),
  );
  await rm(temporary, { recursive: true, force: true });
}
