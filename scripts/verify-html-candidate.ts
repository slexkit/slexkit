import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const plugin = resolve(root, "../obsidian-slexkit");
const output = resolve(root, "test-results/html-candidate");
await mkdir(output, { recursive: true });
type Check = { id: string; command: string[]; cwd: string; timeoutMs: number };
const checks: Check[] = [
  { id: "build", command: ["bun", "run", "build"], cwd: root, timeoutMs: 180000 },
  { id: "lint", command: ["bun", "run", "lint"], cwd: root, timeoutMs: 60000 },
  { id: "types", command: ["bunx", "tsc", "--noEmit"], cwd: root, timeoutMs: 60000 },
  { id: "unit", command: ["bun", "run", "test"], cwd: root, timeoutMs: 180000 },
  { id: "static-conformance", command: ["node", "scripts/cli.mjs", "validate", "--standard", "--json"], cwd: root, timeoutMs: 60000 },
  { id: "component-pack-smoke", command: ["bun", "run", "smoke:web-components"], cwd: root, timeoutMs: 120000 },
  { id: "all-package-smoke", command: ["bun", "run", "smoke:release"], cwd: root, timeoutMs: 300000 },
  { id: "behavior", command: ["node", "scripts/behavior-conformance.mjs"], cwd: root, timeoutMs: 600000 },
  { id: "site", command: ["node", "scripts/browser-acceptance.mjs"], cwd: root, timeoutMs: 180000 },
  { id: "pack-root", command: ["bun", "pm", "pack", "--destination", output], cwd: root, timeoutMs: 60000 },
  { id: "pin-obsidian", command: ["bun", "scripts/prepare-obsidian-candidate.ts"], cwd: root, timeoutMs: 60000 },
  { id: "install-obsidian", command: ["bun", "install"], cwd: plugin, timeoutMs: 180000 },
  { id: "obsidian", command: ["bun", "run", "check"], cwd: plugin, timeoutMs: 180000 },
  { id: "stat-layout", command: ["node", "tests/conformance/stat-value-layout.mjs", "after"], cwd: root, timeoutMs: 180000 },
  { id: "balanced-layout", command: ["node", "tests/conformance/balanced-tiles.mjs"], cwd: root, timeoutMs: 180000 },
  { id: "component-theme", command: ["node", "scripts/web-components-conformance.mjs"], cwd: root, timeoutMs: 180000 },
  { id: "layout-compatibility", command: ["node", "tests/conformance/layout-compatibility.mjs"], cwd: root, timeoutMs: 240000 },
];
const fingerprint = async () => Object.fromEntries(await Promise.all(["dist/slexkit.js", "dist/runtime.js", "dist/web-components.js", "dist/tooling.js", "dist/slexkit.css"].map(async path => [path, createHash("sha256").update(await readFile(resolve(root, path))).digest("hex")])));
const from = process.argv.indexOf("--from");
const start = from < 0 ? 0 : checks.findIndex(check => check.id === process.argv[from + 1]);
if (start < 0) throw new Error("Unknown --from check ID");
let results: Array<Check & { startedAt: string; finishedAt: string; code: number; timedOut: boolean; passed: boolean }> = [];
if (start > 0) {
  const previous = JSON.parse(await readFile(resolve(output, "verification.json"), "utf8"));
  if (JSON.stringify(previous.artifactHashes) !== JSON.stringify(await fingerprint())) throw new Error("Runtime changed since the recorded checks; rerun from build.");
  results = previous.results.slice(0, start);
  if (results.length !== start || results.some((check, index) => !check.passed || check.id !== checks[index].id)) throw new Error("Cannot resume across unverified checks.");
}
for (const check of checks.slice(start)) {
  const startedAt = new Date().toISOString();
  console.log(`Starting ${check.id}: ${check.command.join(" ")}`);
  await writeFile(resolve(output, `${check.id}.log`), "Running: " + check.command.join(" ") + "\n");
  const child = Bun.spawn(check.command, { cwd: check.cwd, env: { ...process.env, SLEXKIT_SMOKE_TIMEOUT_MS: "180000" }, stdout: "pipe", stderr: "pipe" });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    if (process.platform === "win32") Bun.spawnSync(["taskkill", "/PID", String(child.pid), "/T", "/F"], { stdout: "ignore", stderr: "ignore" });
    else child.kill("SIGKILL");
  }, check.timeoutMs);
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  clearTimeout(timer);
  await writeFile(resolve(output, `${check.id}.log`), stdout + stderr);
  results.push({ ...check, startedAt, finishedAt: new Date().toISOString(), code, timedOut, passed: code === 0 && !timedOut });
  await writeFile(resolve(output, "verification.json"), JSON.stringify({ kind: "html-candidate-verification", nodeCompatibility: process.versions.node, node: new TextDecoder().decode(Bun.spawnSync(["node", "--version"]).stdout).trim(), bun: Bun.version, artifactHashes: await fingerprint(), results, passed: results.length === checks.length && results.every(check => check.passed), desktop: "separate real desktop check required" }, null, 2));
  console.log(`${check.id}: ${code === 0 && !timedOut ? "passed" : "FAILED"}`);
  if (code !== 0 || timedOut) throw new Error(`Verification stopped at ${check.id}. Inspect test-results/html-candidate/${check.id}.log`);
}
console.log("Automated candidate checks passed. Desktop acceptance must identify this exact embedded runtime.");
