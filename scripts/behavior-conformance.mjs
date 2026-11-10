import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "test-results/html-migration");
const requestedOutput = process.env.SLEXKIT_CONFORMANCE_OUTPUT
  ? resolve(root, process.env.SLEXKIT_CONFORMANCE_OUTPUT)
  : output;
if (requestedOutput !== output) {
  throw new Error(
    `The HTML workers write to ${output}. Remove SLEXKIT_CONFORMANCE_OUTPUT or set it to test-results/html-migration.`,
  );
}

const browsers = (process.env.SLEXKIT_CONFORMANCE_BROWSERS ?? "chromium,firefox,webkit")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
for (const browser of browsers) {
  if (!new Set(["chromium", "firefox", "webkit"]).has(browser)) {
    throw new Error(`Unknown browser: ${browser}`);
  }
}

await mkdir(resolve(output, "orchestration"), { recursive: true });

function start(command, args, options = {}) {
  return spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...options.env },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    detached: process.platform !== "win32",
  });
}

function terminateTree(child, reason) {
  const evidence = { attempted: false, reason, pid: child.pid ?? null, method: null, error: null };
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return evidence;
  evidence.attempted = true;
  try {
    if (process.platform === "win32") {
      evidence.method = "taskkill /PID <pid> /T /F";
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "pipe",
        windowsHide: true,
      });
    } else {
      evidence.method = "SIGKILL process group";
      process.kill(-child.pid, "SIGKILL");
    }
  } catch (error) {
    evidence.error = String(error?.message ?? error);
  }
  return evidence;
}

async function runChild({ id, command = process.execPath, args, timeoutMs }) {
  const child = start(command, args);
  const stdout = [];
  const stderr = [];
  let spawnError = null;
  let timedOut = false;
  let termination = null;
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  child.on("error", (error) => {
    spawnError = String(error.stack ?? error);
  });
  const watchdog = setTimeout(() => {
    timedOut = true;
    termination = terminateTree(child, `external ${timeoutMs}ms child timeout`);
  }, timeoutMs);
  const exit = await new Promise((resolveExit) => {
    child.on("close", (code, signal) => resolveExit({ code, signal }));
  });
  clearTimeout(watchdog);
  const error =
    spawnError ??
    (timedOut
      ? `Timed out after ${timeoutMs}ms; browser/worker process tree termination was requested.`
      : null) ??
    (exit.code === 0
      ? null
      : `Child exited with code ${exit.code} signal ${exit.signal ?? "none"}.`);
  const result = {
    id,
    command: [command, ...args],
    pid: child.pid ?? null,
    timeoutMs,
    timedOut,
    code: exit.code,
    signal: exit.signal,
    status: error ? "failed" : "passed",
    error,
    termination,
  };
  const log = `# stdout\n${stdout.join("")}\n# stderr\n${stderr.join("")}`;
  await Promise.all([
    writeFile(resolve(output, `${id}.log`), log),
    writeFile(
      resolve(output, "orchestration", `${id}.json`),
      `${JSON.stringify(result, null, 2)}\n`,
    ),
  ]);
  process.stdout.write(`${id}: ${result.status}${timedOut ? " (timed out)" : ""}\n`);
  return result;
}

async function runInfinite(browser) {
  const id = `${browser}-infinite-computation`;
  const child = start(process.execPath, [
    "tests/conformance/infinite-computation-worker.mjs",
    browser,
  ]);
  const stdout = [];
  const stderr = [];
  let marker = null;
  let termination = null;
  let spawnError = null;
  let markerTimer;
  let killTimer;
  const armKill = (line) => {
    if (marker) return;
    marker = { text: line.trim(), observedAt: new Date().toISOString() };
    clearTimeout(markerTimer);
    killTimer = setTimeout(() => {
      termination = terminateTree(child, "external bounded watchdog after start marker");
    }, 3000);
  };
  child.stdout.on("data", (chunk) => {
    const text = String(chunk);
    stdout.push(text);
    for (const line of stdout.join("").split(/\r?\n/)) {
      if (line.includes("infinite-computation-start")) armKill(line);
    }
  });
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  child.on("error", (error) => {
    spawnError = String(error.stack ?? error);
  });
  markerTimer = setTimeout(() => {
    termination = terminateTree(child, "start marker not emitted within 30000ms");
  }, 30000);
  const exit = await new Promise((resolveExit) => {
    child.on("close", (code, signal) =>
      resolveExit({ code, signal, exitedAt: new Date().toISOString() }),
    );
  });
  clearTimeout(markerTimer);
  clearTimeout(killTimer);
  const passed = Boolean(marker && termination?.attempted && !termination.error);
  const error =
    spawnError ??
    (!marker
      ? "Worker exited or was terminated before emitting the pre-blocking start marker."
      : null) ??
    (!termination?.attempted
      ? "Worker exited before the external watchdog terminated its process tree."
      : null) ??
    termination.error;
  const result = {
    id,
    command: [process.execPath, "tests/conformance/infinite-computation-worker.mjs", browser],
    pid: child.pid ?? null,
    timeoutMs: { marker: 30000, afterMarker: 3000 },
    marker,
    externallyTerminated: passed,
    code: exit.code,
    signal: exit.signal,
    exitedAt: exit.exitedAt,
    status: passed ? "passed" : "failed",
    error: error ?? null,
    termination,
    claim:
      "The start marker is emitted immediately before the blocking payload. No heartbeat or in-page recovery is claimed.",
  };
  await Promise.all([
    writeFile(
      resolve(output, `${id}.log`),
      `# stdout\n${stdout.join("")}\n# stderr\n${stderr.join("")}`,
    ),
    writeFile(
      resolve(output, "orchestration", `${id}.json`),
      `${JSON.stringify(result, null, 2)}\n`,
    ),
  ]);
  process.stdout.write(`${id}: ${result.status}\n`);
  return result;
}

async function probeCoreServer() {
  try {
    const [host, runtime] = await Promise.all([
      fetch("http://127.0.0.1:4197/", { signal: AbortSignal.timeout(1500) }),
      fetch("http://127.0.0.1:4197/dist/slexkit.js", { signal: AbortSignal.timeout(1500) }),
    ]);
    const hostText = await host.text();
    return {
      reachable: true,
      compatible: host.ok && runtime.ok && hostText.includes("SlexKit HTML host"),
    };
  } catch (error) {
    return { reachable: false, compatible: false, error: String(error?.message ?? error) };
  }
}

async function waitForCoreServer(child) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(`Owned HTML core server exited with code ${child.exitCode}.`);
    const probe = await probeCoreServer();
    if (probe.compatible) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error("Owned HTML core server did not become ready on port 4197 within 30000ms.");
}

async function startAdapterServer() {
  const child = start("bun", ["tests/conformance/server.ts"]);
  const stdout = [];
  const stderr = [];
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const match = stdout.join("").match(/\{"url":"([^"]+)"\}/);
    if (match) return { child, url: match[1], stdout, stderr };
    if (child.exitCode !== null)
      throw new Error(`Adapter server exited ${child.exitCode}: ${stderr.join("")}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  const termination = terminateTree(child, "adapter server startup timeout");
  throw new Error(`Adapter server startup timeout. ${termination.error ?? stderr.join("")}`);
}

const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
async function runtimeHashes() {
  const files = ["dist/slexkit.js", "dist/runtime.js", "dist/web-components.js", "dist/tooling.js", "dist/slexkit.css", "tests/conformance/html-fixtures.ts", "tests/conformance/html-adapters-client.tsx", "tests/conformance/html-adapters-worker.mjs", "tests/conformance/adapter-layout-checks.mjs", "scripts/behavior-conformance.mjs"];
  return Object.fromEntries(await Promise.all(files.map(async file => [file, createHash("sha256").update(await readFile(resolve(root, file))).digest("hex")])));
}
const run = {
  schemaVersion: 1,
  kind: "html-migration-conformance",
  output: "test-results/html-migration",
  runtimeVersion: pkg.version,
  artifactHashes: await runtimeHashes(),
  startedAt: new Date().toISOString(),
  browsers,
  additionalBrowsers: [],
  servers: {},
  results: [],
  error: null,
};
let coreServer = null;
let adapterServer = null;
try {
  const coreProbe = await probeCoreServer();
  if (coreProbe.reachable && !coreProbe.compatible) {
    throw new Error(
      "Port 4197 is occupied by a server that is not the current HTML conformance host; it was not modified.",
    );
  }
  if (coreProbe.compatible) {
    run.servers.core = { ownership: "external-compatible", url: "http://127.0.0.1:4197" };
  } else {
    coreServer = start("bun", ["tests/conformance/html-server.ts"], { env: { PORT: "4197" } });
    await waitForCoreServer(coreServer);
    run.servers.core = { ownership: "owned", pid: coreServer.pid, url: "http://127.0.0.1:4197" };
  }
  adapterServer = await startAdapterServer();
  run.servers.adapters = {
    ownership: "owned",
    pid: adapterServer.child.pid,
    url: adapterServer.url,
  };

  for (const browser of browsers) {
    const scenarios = [
      ["core", ["tests/conformance/html-worker.mjs", browser], 120000],
      ["components", ["tests/conformance/html-components-worker.mjs", browser], 60000],
      ["relocation", ["tests/conformance/html-frame-relocation-worker.mjs", browser], 120000],
      [
        "adapters",
        ["tests/conformance/html-adapters-worker.mjs", browser, adapterServer.url],
        150000,
      ],
      ["resources", ["tests/conformance/html-resources-worker.mjs", browser], 150000],
      ["csp", ["tests/html/browser-csp-check.mjs", browser], 90000],
      ["offline-assets", ["tests/html/browser-offline-assets-check.mjs", browser], 90000],
      ["animations", ["tests/conformance/animation-worker.mjs", browser], 60000],
    ];
    for (const [scenario, args, timeoutMs] of scenarios) {
      run.results.push(await runChild({ id: `${browser}-${scenario}`, args, timeoutMs }));
    }
    run.results.push(await runInfinite(browser));
  }
  for (const [name, channel] of [["chrome", "chrome"], ["edge", "msedge"]]) {
    const availability = { name, channel, status: "probing", version: null };
    run.additionalBrowsers.push(availability);
    let probe;
    try {
      probe = await chromium.launch({ channel, headless: true, timeout: 10000 });
      availability.version = probe.version();
      availability.status = "tested";
    } catch (error) {
      availability.error = String(error.message);
      const missing = /executable doesn't exist|distribution .+ not found|browser is not installed/i.test(error.message);
      availability.status = missing ? "unavailable" : "failed";
      if (!missing) run.error = `Installed ${name} could not launch: ${error.message}`;
      continue;
    } finally { await probe?.close(); }
    run.results.push(await runChild({
      id: `${name}-adapters`,
      args: ["tests/conformance/html-adapters-worker.mjs", name, adapterServer.url],
      timeoutMs: 150000,
    }));
  }
} catch (error) {
  run.error = String(error?.stack ?? error);
  process.stderr.write(`${run.error}\n`);
} finally {
  if (adapterServer?.child)
    run.servers.adapters.termination = terminateTree(
      adapterServer.child,
      "orchestrator cleanup of owned adapter server",
    );
  if (coreServer)
    run.servers.core.termination = terminateTree(
      coreServer,
      "orchestrator cleanup of owned core server",
    );
  run.finishedAt = new Date().toISOString();
  if (JSON.stringify(await runtimeHashes()) !== JSON.stringify(run.artifactHashes))
    run.error = "Runtime assets changed during acceptance; rebuild and rerun against one frozen candidate.";
  run.status =
    !run.error &&
    run.results.length === browsers.length * 9 + run.additionalBrowsers.filter(browser => browser.status === "tested").length &&
    run.results.every((item) => item.status === "passed")
      ? "passed"
      : "failed";
  await writeFile(resolve(output, "run.json"), `${JSON.stringify(run, null, 2)}\n`);
}
if (run.status !== "passed") process.exitCode = 1;
