#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readFileSync } from "node:fs";

const root = resolve(import.meta.dirname, "..");
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = process.env.SLEXKIT_SMOKE_VERSION || rootPackage.version;
const appDir = mkdtempSync(join(tmpdir(), "slexkit-registry-smoke-"));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

if (!version) throw new Error("Unable to determine SlexKit version for registry smoke.");

function run(command, args, options = {}) {
  const isWindowsCmd = process.platform === "win32" && command.endsWith(".cmd");
  const output = execFileSync(
    isWindowsCmd ? "cmd.exe" : command,
    isWindowsCmd ? ["/d", "/s", "/c", command, ...args] : args,
    {
      cwd: options.cwd ?? root,
      encoding: "utf8",
      shell: false,
      stdio: options.stdio ?? "pipe",
    },
  );
  return String(output ?? "").trim();
}

const packages = [
  `slexkit@${version}`,
  `@slexkit/runtime@${version}`,
  `@slexkit/components-svelte@${version}`,
  `@slexkit/theme-shadcn@${version}`,
  `@slexkit/streamdown@${version}`,
  `@slexkit/mcp@${version}`,
  "react",
  "react-dom",
  "streamdown",
];

writeFileSync(
  join(appDir, "package.json"),
  JSON.stringify({ private: true, type: "module" }, null, 2),
);

run(npmCommand, ["install", "--no-audit", "--no-fund", "--ignore-scripts", ...packages], {
  cwd: appDir,
  stdio: "inherit",
});

writeFileSync(
  join(appDir, "smoke.mjs"),
  [
    "import { createRequire } from 'node:module';",
    "import { spawnSync } from 'node:child_process';",
    "import { existsSync } from 'node:fs';",
    "import { join } from 'node:path';",
    "import { mount as rootMount } from 'slexkit/runtime';",
    "import { mount as scopedMount } from '@slexkit/runtime';",
    "import '@slexkit/components-svelte';",
    "import { SlexKitRenderer, createSlexKitRenderer, slexkitRenderer } from '@slexkit/streamdown';",
    "const require = createRequire(import.meta.url);",
    "for (const id of ['@slexkit/theme-shadcn/style.css', '@slexkit/theme-shadcn/base.css', '@slexkit/theme-shadcn/components/button.css', '@slexkit/streamdown/style.css']) require.resolve(id);",
    "if (typeof rootMount !== 'function') throw new Error('slexkit/runtime mount missing');",
    "if (typeof scopedMount !== 'function') throw new Error('@slexkit/runtime mount missing');",
    "if (typeof slexkitRenderer !== 'object') throw new Error('@slexkit/streamdown renderer missing');",
    "if (typeof createSlexKitRenderer !== 'function') throw new Error('@slexkit/streamdown factory missing');",
    "if (typeof SlexKitRenderer !== 'function') throw new Error('@slexkit/streamdown component missing');",
    "const mcpBinBase = join(process.cwd(), 'node_modules', '.bin', 'slexkit-mcp');",
    "const mcpBin = (process.platform === 'win32' ? [`${mcpBinBase}.cmd`, `${mcpBinBase}.exe`, mcpBinBase] : [mcpBinBase]).find(existsSync);",
    "if (!mcpBin) throw new Error('slexkit-mcp binary missing');",
    "const input = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) + '\\n';",
    "const result = process.platform === 'win32' && mcpBin.endsWith('.cmd')",
    "  ? spawnSync('cmd.exe', ['/d', '/s', '/c', mcpBin], { input, encoding: 'utf8', timeout: 5000 })",
    "  : spawnSync(mcpBin, [], { input, encoding: 'utf8', timeout: 5000 });",
    "if (result.error) throw result.error;",
    "if (result.status !== 0 && !result.stdout) throw new Error(result.stderr || `slexkit-mcp exited with ${result.status}`);",
    "const line = result.stdout.trim().split(/\\r?\\n/)[0];",
    "const response = JSON.parse(line);",
    "if (response.result?.serverInfo?.name !== '@slexkit/mcp') throw new Error('@slexkit/mcp initialize failed');",
    "console.log('registry smoke ok');",
  ].join("\n"),
);

run("node", ["smoke.mjs"], { cwd: appDir, stdio: "inherit" });

console.log(`registry smoke ok\nversion=${version}\nappDir=${appDir}`);
