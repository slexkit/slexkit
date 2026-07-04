import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const explicitBaseUrl = process.env.SLEXKIT_ACCEPTANCE_URL || process.env.BASE_URL || "";
const acceptancePort = Number(process.env.SLEXKIT_ACCEPTANCE_PORT || 4011);
const baseUrl = (explicitBaseUrl || `http://127.0.0.1:${acceptancePort}`).replace(/\/$/, "");
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const session = process.env.AGENT_BROWSER_SESSION || "slexkit-acceptance";
const agentBrowserBin = process.env.AGENT_BROWSER_BIN || "agent-browser";
const agentBrowserCommandTimeoutMs = Number(process.env.AGENT_BROWSER_COMMAND_TIMEOUT_MS || 45000);
const serverStartupTimeoutMs = Number(process.env.SLEXKIT_ACCEPTANCE_SERVER_TIMEOUT_MS || 60000);
const writeScreenshots = process.env.SLEXKIT_ACCEPTANCE_SCREENSHOTS === "1";
const shouldStartServer = !explicitBaseUrl && process.env.SLEXKIT_ACCEPTANCE_START_SERVER !== "0";
let serverProcess;
let serverStartError;
const serverLog = [];

const siteRoutes = [
  "/",
  "/docs/guides/quick-start",
  "/docs/reference/packages",
  "/docs/reference/toolhost",
  "/docs/reference/standard",
  "/docs/components/radio-group",
  "/examples",
  "/examples/toolhost-demo",
  "/examples/assistant-ui-host",
];

const adapterRoutes = [
  "/adapter-demos/assistant-ui/",
  "/adapter-demos/streamdown/",
  "/adapter-demos/tiptap/",
];

const jsonRoutes = [
  "/healthz",
  "/api/health",
  "/slexkit-ai-manifest.json",
  "/standard/slex-standard-manifest.json",
  "/standard/slex-expression.schema.json",
  "/standard/slex-component-catalog.json",
  "/standard/slex-logic-profile.json",
  "/standard/slex-capabilities.catalog.json",
  "/standard/slex-conformance.json",
  "/api/wiki-docs",
  "/api/examples-docs",
];

const textRoutes = [
  "/llms.txt",
  "/llms-full.txt",
  "/llms-components.txt",
  "/llms-runtime.txt",
  "/llms-capabilities.txt",
  "/llms-toolhost.txt",
  "/llms-authoring.txt",
];

const availabilityRoutes = [
  "/healthz",
  "/",
  "/docs/reference/packages",
  "/docs/reference/toolhost",
  "/examples/toolhost-demo",
  "/adapter-demos/assistant-ui/",
  "/slexkit-ai-manifest.json",
  "/standard/slex-component-catalog.json",
  "/api/wiki-docs",
  "/api/examples-docs",
];

function firstLine(value) {
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rememberServerLog(chunk) {
  serverLog.push(String(chunk));
  while (serverLog.length > 60) serverLog.shift();
}

function formatServerLog() {
  return serverLog.join("").split(/\r?\n/).slice(-30).join("\n");
}

async function fetchWithTimeout(url, timeoutMs = 2000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function isServerReady() {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/healthz`);
    return response.ok;
  } catch {
    return false;
  }
}

function stopAcceptanceServer() {
  if (!serverProcess || serverProcess.killed || serverProcess.exitCode !== null) return;
  serverProcess.kill();
}

async function startAcceptanceServer() {
  if (!shouldStartServer) return;
  if (await isServerReady()) return;

  serverProcess = spawn("bun", ["run", "site/server.ts"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(acceptancePort),
      SLEXKIT_LIVE_RELOAD: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

  serverProcess.stdout.on("data", rememberServerLog);
  serverProcess.stderr.on("data", rememberServerLog);
  serverProcess.on("error", (error) => {
    serverStartError = error;
    rememberServerLog(`${error.message}\n`);
  });
  process.once("exit", stopAcceptanceServer);
  process.once("SIGINT", () => {
    stopAcceptanceServer();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    stopAcceptanceServer();
    process.exit(143);
  });

  const started = Date.now();
  while (Date.now() - started < serverStartupTimeoutMs) {
    if (serverStartError) {
      throw new Error(`acceptance server failed to start:\n${formatServerLog()}`);
    }
    if (serverProcess.exitCode !== null) {
      throw new Error(`acceptance server exited with code ${serverProcess.exitCode}:\n${formatServerLog()}`);
    }
    if (await isServerReady()) return;
    await sleep(250);
  }

  throw new Error(`Timed out waiting for acceptance server at ${baseUrl}:\n${formatServerLog()}`);
}

function resolveAgentBrowserCommand() {
  if (process.env.AGENT_BROWSER_BIN) {
    const bin = process.env.AGENT_BROWSER_BIN;
    if (process.platform === "win32" && bin.toLowerCase().endsWith(".ps1")) {
      return { command: "powershell.exe", prefix: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", bin] };
    }
    return { command: bin, prefix: [] };
  }

  if (process.platform === "win32") {
    const result = spawnSync("where.exe", ["agent-browser.ps1"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const ps1 = firstLine(result.stdout);
    if (ps1) {
      return { command: "powershell.exe", prefix: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1] };
    }
  }

  return { command: agentBrowserBin, prefix: [] };
}

const agentBrowserCommand = resolveAgentBrowserCommand();

function runAgentBrowser(args, { allowFailure = false, retriedOpen = false } = {}) {
  const result = spawnSync(agentBrowserCommand.command, [...agentBrowserCommand.prefix, "--session", session, ...args], {
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: agentBrowserCommandTimeoutMs,
  });

  const output = `${result.stdout || ""}${result.stderr || ""}${result.error ? `\n${result.error.message}` : ""}`;
  if (!allowFailure && result.status !== 0) {
    if (args[0] === "open" && !retriedOpen) {
      spawnSync(agentBrowserCommand.command, [...agentBrowserCommand.prefix, "--session", session, "wait", "1000"], {
        encoding: "utf8",
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: agentBrowserCommandTimeoutMs,
      });
      return runAgentBrowser(args, { allowFailure, retriedOpen: true });
    }
    throw new Error(`agent-browser ${args.join(" ")} failed:\n${output}`);
  }
  return output.trim();
}

function lastNonEmptyLine(output) {
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1) || "";
}

function evalJson(source) {
  const output = runAgentBrowser(["eval", source.replace(/\s+/g, " ").trim()]);
  const line = lastNonEmptyLine(output);
  if (!line) throw new Error(`agent-browser eval returned no output for ${source}`);
  const parsed = JSON.parse(line);
  return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
}

function openRoute(route) {
  runAgentBrowser(["open", `${baseUrl}${route}`]);
  runAgentBrowser(["wait", "--load", "networkidle"]);
}

function clearBrowserErrors() {
  runAgentBrowser(["errors", "--clear"], { allowFailure: true });
}

function readBrowserErrors() {
  return runAgentBrowser(["errors", "--clear"], { allowFailure: true });
}

function pageProbe() {
  return evalJson(`JSON.stringify({
    path: location.pathname,
    title: document.title,
    textLength: document.body.innerText.length,
    overlay: !!document.querySelector('.vite-error-overlay,[data-nextjs-dialog],#webpack-dev-server-client-overlay'),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    overflowDelta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    theme: document.documentElement.dataset.theme || '',
    dark: document.documentElement.classList.contains('dark'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color
  })`);
}

function luminanceFromColor(value) {
  const matches = String(value).match(/[-+]?\d*\.?\d+/g);
  if (!matches || matches.length < 3) return 255;
  let [r, g, b] = matches.map(Number);
  if (Math.max(r, g, b) <= 1) {
    r *= 255;
    g *= 255;
    b *= 255;
  }
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isDarkBackground(value) {
  return luminanceFromColor(value) < 96;
}

async function configureTheme({ width, height, media, theme }) {
  runAgentBrowser(["set", "viewport", String(width), String(height)]);
  runAgentBrowser(["set", "media", media]);
  openRoute("/");
  evalJson(`localStorage.setItem('slexkit:theme', '${theme}'); location.reload(); JSON.stringify({ theme: '${theme}' })`);
  runAgentBrowser(["wait", "--load", "networkidle"]);
}

async function runBrowserMatrix({ name, width, height, media, theme, requireDark }) {
  await configureTheme({ width, height, media, theme });
  clearBrowserErrors();

  const rows = [];
  for (const route of [...siteRoutes, ...adapterRoutes]) {
    openRoute(route);
    const probe = pageProbe();
    const errors = readBrowserErrors();
    const isAdapter = adapterRoutes.includes(route);
    const darkOk = isAdapter ? isDarkBackground(probe.bodyBg) : probe.dark === true;
    const ok =
      probe.textLength >= 80 &&
      probe.overlay === false &&
      probe.horizontalOverflow === false &&
      !errors &&
      (!requireDark || darkOk);
    rows.push({
      matrix: name,
      route,
      title: probe.title,
      textLength: probe.textLength,
      overflowDelta: probe.overflowDelta,
      theme: probe.theme,
      darkOk: requireDark ? darkOk : undefined,
      ok,
      errors,
    });
  }

  if (writeScreenshots) {
    openRoute("/");
    runAgentBrowser(["screenshot", `tmp-browser-acceptance-${name}-home.png`, "--full"]);
    openRoute("/adapter-demos/assistant-ui/");
    runAgentBrowser(["screenshot", `tmp-browser-acceptance-${name}-assistant-ui.png`, "--full"]);
  }

  return rows;
}

async function runEndpointChecks() {
  const rows = [];
  for (const route of [...jsonRoutes, ...textRoutes]) {
    try {
      const response = await fetch(`${baseUrl}${route}`);
      const body = await response.text();
      if (jsonRoutes.includes(route)) JSON.parse(body);
      const ok = response.ok && body.length > 20;
      rows.push({
        route,
        status: response.status,
        type: response.headers.get("content-type") || "",
        bytes: body.length,
        ok,
      });
    } catch (error) {
      rows.push({ route, status: "ERR", type: "", bytes: 0, ok: false, error: error.message });
    }
  }

  const health = await fetch(`${baseUrl}/healthz`).then((response) => response.json());
  const manifest = await fetch(`${baseUrl}/standard/slex-standard-manifest.json`).then((response) => response.json());
  const catalog = await fetch(`${baseUrl}/standard/slex-component-catalog.json`).then((response) => response.json());
  const catalogTypes = new Set((catalog.components || []).map((item) => item.type));

  rows.push({
    route: "standard-summary",
    status: 200,
    type: "assertion",
    bytes: catalog.components?.length ?? 0,
    ok:
      health.ok === true &&
      health.version === "0.4.0" &&
      health.protocolVersion === "0.1" &&
      manifest.version === "0.4.0" &&
      manifest.protocolVersion === "0.1" &&
      !catalogTypes.has("step") &&
      !catalogTypes.has("submit") &&
      (catalog.components?.length ?? 0) >= 20,
  });

  return rows;
}

async function runAvailabilityProbe() {
  const requests = [];
  for (let round = 0; round < 5; round += 1) {
    for (const route of availabilityRoutes) requests.push({ round, route });
  }

  const started = performance.now();
  const rows = await Promise.all(requests.map(async ({ round, route }) => {
    const t0 = performance.now();
    try {
      const response = await fetch(`${baseUrl}${route}`, { cache: "no-store" });
      const body = await response.text();
      return {
        round,
        route,
        status: response.status,
        bytes: body.length,
        ms: Math.round(performance.now() - t0),
        ok: response.ok && body.length > 20,
      };
    } catch (error) {
      return { round, route, status: "ERR", bytes: 0, ms: Math.round(performance.now() - t0), ok: false, error: error.message };
    }
  }));

  return {
    total: rows.length,
    failed: rows.filter((row) => !row.ok).length,
    elapsedMs: Math.round(performance.now() - started),
    slowest: [...rows].sort((a, b) => b.ms - a.ms).slice(0, 8),
    ok: rows.every((row) => row.ok),
  };
}

async function main() {
  await startAcceptanceServer();

  const desktopRows = await runBrowserMatrix({
    name: "desktop-light",
    width: 1440,
    height: 1000,
    media: "light",
    theme: "light",
    requireDark: false,
  });
  const mobileRows = await runBrowserMatrix({
    name: "mobile-dark",
    width: 390,
    height: 844,
    media: "dark",
    theme: "dark",
    requireDark: true,
  });
  const endpointRows = await runEndpointChecks();
  const availability = await runAvailabilityProbe();

  const browserRows = [...desktopRows, ...mobileRows];
  const failedBrowser = browserRows.filter((row) => !row.ok);
  const failedEndpoints = endpointRows.filter((row) => !row.ok);

  console.log(`SlexKit browser acceptance: ${baseUrl}`);
  console.table(browserRows.map(({ matrix, route, title, textLength, overflowDelta, theme, darkOk, ok }) => ({
    matrix,
    route,
    title,
    textLength,
    overflowDelta,
    theme,
    darkOk,
    ok,
  })));
  console.table(endpointRows);
  console.log(JSON.stringify({ availability }, null, 2));

  if (failedBrowser.length || failedEndpoints.length || !availability.ok) {
    console.error(JSON.stringify({ failedBrowser, failedEndpoints, availability }, null, 2));
    process.exitCode = 1;
  }
}

try {
  await main();
} finally {
  stopAcceptanceServer();
}
