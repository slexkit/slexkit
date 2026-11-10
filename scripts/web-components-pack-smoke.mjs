import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "slexkit-elements-"));
const consumer = join(temporary, "consumer");
const installed = join(consumer, "node_modules", "slexkit");
await mkdir(installed, { recursive: true });
// A no-network artifact check: verify the real tarball, not source aliases or
// workspace links. The bundle has no external JS dependencies to install.
execFileSync("bun", ["pm", "pack", "--destination", temporary], { cwd: root, stdio: "pipe", windowsHide: true });
const archive = (await readdir(temporary)).find((name) => name.endsWith(".tgz"));
assert.ok(archive, "Missing packed archive");
execFileSync("tar", ["-xf", join(temporary, archive), "-C", installed, "--strip-components", "1"], { stdio: "pipe", windowsHide: true });
await writeFile(join(consumer, "package.json"), '{"private":true,"type":"module"}\n');
await writeFile(join(consumer, "smoke.mjs"), `
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineSlexElements, describeSlexElements } from 'slexkit/web-components';
import * as runtime from 'slexkit';
const require = createRequire(import.meta.url);
assert.equal(typeof runtime.mount, 'function');
assert.equal(typeof runtime.createSlexKitMarkdownRuntimeHost, 'function');
assert.equal(runtime.inspectSlexSource('{ g: {}, layout: {} }').ok, false);
assert.equal(runtime.inspectSlexSource('<slex-stat value="3"></slex-stat>').ok, true);
const commonjs = require('slexkit');
assert.equal(typeof commonjs.mount, 'function');
assert.equal(commonjs.getSlexKitInfo().protocolVersion, 'html-1');
assert.equal(typeof defineSlexElements, 'function');
assert.equal(describeSlexElements().length, 28);
const manifest = JSON.parse(readFileSync(require.resolve('slexkit/custom-elements.json'), 'utf8'));
assert.equal(manifest.modules[0].declarations.length, describeSlexElements().length);
assert.ok(readFileSync(new URL('./ai/web-components.md', import.meta.resolve('slexkit/web-components')), 'utf8').includes('HTML-first SlexKit'));
console.log('Packed component imports, manifest and AI guide passed');
`);
const output = execFileSync(process.execPath, [join(consumer, "smoke.mjs")], { cwd: consumer, encoding: "utf8", windowsHide: true });
const source = await readFile(join(root, "dist", "web-components.js"));
const packed = await readFile(join(installed, "dist", "web-components.js"));
assert.deepEqual(packed, source);
const report = {
  createdAt: new Date().toISOString(), archive: join(temporary, archive), consumer,
  sha256: createHash("sha256").update(packed).digest("hex"), passed: true,
  scope: "Actual root tarball, isolated consumer module resolution, no registry installation. Full multi-package install smoke is separate.",
};
await mkdir(join(root, "test-results", "web-components"), { recursive: true });
await writeFile(join(root, "test-results", "web-components", "pack-report.json"), JSON.stringify(report, null, 2));
console.log(output.trim());
