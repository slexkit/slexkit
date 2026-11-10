#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = process.env.SLEXKIT_SMOKE_VERSION || rootPackage.version;
const installSpec = process.env.SLEXKIT_SMOKE_SPEC || `slexkit@${version}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
if (!version) throw new Error("Unable to determine SlexKit version for registry smoke.");

const appDir = mkdtempSync(join(tmpdir(), "slexkit-registry-smoke-"));
function run(command, args, options = {}) {
  const isWindowsCmd = process.platform === "win32" && command.endsWith(".cmd");
  return String(
    execFileSync(
      isWindowsCmd ? "cmd.exe" : command,
      isWindowsCmd ? ["/d", "/s", "/c", command, ...args] : args,
      { cwd: options.cwd ?? root, encoding: "utf8", shell: false, stdio: options.stdio ?? "pipe" },
    ) ?? "",
  ).trim();
}

try {
  writeFileSync(
    join(appDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }, null, 2),
  );
  run(npmCommand, ["install", "--no-audit", "--no-fund", "--ignore-scripts", installSpec], {
    cwd: appDir,
    stdio: "inherit",
  });
  writeFileSync(
    join(appDir, "smoke.mjs"),
    `
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { defineSlexElements, describeSlexElements } from "slexkit/web-components";

const require = createRequire(import.meta.url);
const manifestPath = require.resolve("slexkit/custom-elements.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const metadata = JSON.parse(readFileSync(join(dirname(manifestPath), "..", "package.json"), "utf8"));
assert.equal(metadata.customElements, "./dist/custom-elements.json");
assert.ok(metadata.exports["./web-components"]?.import.endsWith("web-components.js"));
assert.equal(metadata.exports["./custom-elements.json"], "./dist/custom-elements.json");
assert.equal(manifest.packageVersion, metadata.version);
assert.equal(manifest.modules?.[0]?.path, "dist/web-components.js");

const declarations = manifest.modules.flatMap(module => module.declarations ?? []).filter(item => item.customElement);
const described = describeSlexElements();
assert.ok(declarations.length > 0);
assert.deepEqual(declarations.map(item => item.tagName).sort(), described.map(item => item.tagName).sort());
for (const declaration of declarations) {
  const description = described.find(item => item.tagName === declaration.tagName);
  assert(description, declaration.tagName + " is missing from describeSlexElements()");
  assert.deepEqual((declaration.attributes ?? []).map(item => item.name).sort(), description.properties.filter(item => item.attribute).map(item => item.attribute).sort());
  const slug = declaration.tagName.slice("slex-".length);
  const entry = await import("slexkit/components/" + slug);
  assert.equal(typeof entry.define, "function", "component entry missing for " + slug);
}
assert.equal(typeof defineSlexElements, "function");
console.log(JSON.stringify({ status: "passed", version: metadata.version, customElements: declarations.length, manifest: manifestPath }));
`,
  );
  run("node", ["smoke.mjs"], { cwd: appDir, stdio: "inherit" });
  console.log(`registry custom-element smoke ok\nversion=${version}`);
} finally {
  rmSync(appDir, { recursive: true, force: true });
}
