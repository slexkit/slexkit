#!/usr/bin/env node
import { execFile, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packDir = mkdtempSync(join(tmpdir(), "slexkit-pack-"));
const appDir = mkdtempSync(join(tmpdir(), "slexkit-smoke-"));
const npmExecPath = process.env.npm_execpath;
const npmExecName = npmExecPath ? basename(npmExecPath).toLowerCase() : "";
const npmExecIsBun = npmExecName === "bun" || npmExecName === "bun.exe";
const npmExecIsScript = npmExecPath && !npmExecIsBun && /\.(?:c?js|mjs)$/i.test(npmExecPath);
const npmCommand = npmExecPath && !npmExecIsBun
  ? npmExecIsScript
    ? process.execPath
    : npmExecPath
  : process.platform === "win32"
    ? "npm.cmd"
    : "npm";
const npmPrefix = npmExecPath && npmExecIsScript ? [npmExecPath] : [];

function run(command, args, options = {}) {
  const isWindowsCmd = process.platform === "win32" && command.endsWith(".cmd");
  const output = execFileSync(isWindowsCmd ? "cmd.exe" : command, isWindowsCmd ? ["/d", "/s", "/c", command, ...args] : args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    shell: false,
    stdio: options.stdio ?? "pipe",
  });
  return String(output ?? "").trim();
}

function runAsync(command, args, options = {}) {
  const isWindowsCmd = process.platform === "win32" && command.endsWith(".cmd");
  return new Promise((resolve, reject) => {
    const child = execFile(
      isWindowsCmd ? "cmd.exe" : command,
      isWindowsCmd ? ["/d", "/s", "/c", command, ...args] : args,
      { cwd: options.cwd ?? root, encoding: "utf8", shell: false, maxBuffer: 50 * 1024 * 1024 },
      (error, stdout) => {
        if (error) reject(error);
        else resolve(String(stdout ?? "").trim());
      },
    );
    if (options.stdio === "inherit" && child.stdout) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }
  });
}

function runNpm(args, options = {}) {
  return run(npmCommand, [...npmPrefix, ...args], options);
}

function runNpmAsync(args, options = {}) {
  return runAsync(npmCommand, [...npmPrefix, ...args], options);
}

function installPackedApp(args, options = {}) {
  if (npmExecIsBun && npmExecPath) {
    return run(npmExecPath, ["install", ...args], options);
  }

  return runNpm(["install", "--no-audit", "--no-fund", "--ignore-scripts", ...args], options);
}

async function pack(packagePath = ".") {
  const output = await runNpmAsync(["pack", packagePath, "--pack-destination", packDir]);
  return join(packDir, output.split(/\r?\n/).at(-1));
}

const tarballs = [];
for (const pkg of [".", "./packages/runtime", "./packages/components-svelte", "./packages/streamdown", "./packages/theme-shadcn", "./packages/obsidian", "./packages/mcp"]) {
  tarballs.push(await pack(pkg));
}

writeFileSync(
  join(appDir, "package.json"),
  JSON.stringify({ private: true, type: "module" }, null, 2),
);

installPackedApp([...tarballs, "react", "react-dom", "streamdown"], { cwd: appDir, stdio: "inherit" });

writeFileSync(
  join(appDir, "smoke.mjs"),
  [
    "import { spawn } from 'node:child_process';",
    "import { mount as rootMount } from 'slexkit/runtime';",
    "import { mount as scopedMount } from '@slexkit/runtime';",
    "import '@slexkit/components-svelte';",
    "import { SlexKitRenderer, createSlexKitRenderer, slexkitRenderer } from '@slexkit/streamdown';",
    "import { createRequire } from 'node:module';",
    "import { existsSync } from 'node:fs';",
    "import { join } from 'node:path';",
    "const require = createRequire(import.meta.url);",
    "const themeCss = require.resolve('@slexkit/theme-shadcn/style.css');",
    "const themeBaseCss = require.resolve('@slexkit/theme-shadcn/base.css');",
    "const themeButtonCss = require.resolve('@slexkit/theme-shadcn/components/button.css');",
    "const streamdownCss = require.resolve('@slexkit/streamdown/style.css');",
    "if (typeof rootMount !== 'function') throw new Error('slexkit/runtime mount missing');",
    "if (typeof scopedMount !== 'function') throw new Error('@slexkit/runtime mount missing');",
    "if (typeof slexkitRenderer !== 'object') throw new Error('@slexkit/streamdown renderer missing');",
    "if (typeof createSlexKitRenderer !== 'function') throw new Error('@slexkit/streamdown factory missing');",
    "if (typeof SlexKitRenderer !== 'function') throw new Error('@slexkit/streamdown component missing');",
    "if (!themeCss.endsWith('style.css')) throw new Error('theme CSS export did not resolve');",
    "if (!themeBaseCss.endsWith('base.css')) throw new Error('theme base CSS export did not resolve');",
    "if (!themeButtonCss.endsWith('button.css')) throw new Error('theme component CSS export did not resolve');",
    "if (!streamdownCss.endsWith('style.css')) throw new Error('streamdown CSS export did not resolve');",
    "const Module = require('node:module');",
    "const originalLoad = Module._load;",
    "Module._load = function patchedLoad(request, parent, isMain) {",
    "  if (request === 'obsidian') {",
    "    return {",
    "      MarkdownRenderChild: class { constructor(containerEl) { this.containerEl = containerEl; } },",
    "      Plugin: class { registerMarkdownCodeBlockProcessor() {} },",
    "    };",
    "  }",
    "  return originalLoad.apply(this, arguments);",
    "};",
    "const ObsidianPlugin = require('@slexkit/obsidian');",
    "Module._load = originalLoad;",
    "if (typeof ObsidianPlugin !== 'function') throw new Error('@slexkit/obsidian did not export a plugin constructor');",
    "if (ObsidianPlugin.default !== ObsidianPlugin) throw new Error('@slexkit/obsidian default export mismatch');",
    "const mcpBinBase = join(process.cwd(), 'node_modules', '.bin', 'slexkit-mcp');",
    "const mcpBin = (process.platform === 'win32' ? [`${mcpBinBase}.cmd`, `${mcpBinBase}.exe`, `${mcpBinBase}.bunx`, mcpBinBase] : [mcpBinBase]).find(existsSync);",
    "if (!mcpBin) throw new Error('slexkit-mcp binary missing');",
    "const mcpCommand = process.platform === 'win32' && mcpBin.endsWith('.cmd') ? ['cmd.exe', ['/d', '/s', '/c', mcpBin]] : [mcpBin, []];",
    "const mcp = spawn(mcpCommand[0], mcpCommand[1], { cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'], shell: false });",
    "let buffer = '';",
    "let stderr = '';",
    "mcp.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });",
    "function waitForLine() {",
    "  return new Promise((resolve, reject) => {",
    "    const timer = setTimeout(() => reject(new Error('MCP smoke timed out')), 5000);",
    "    function cleanup() { clearTimeout(timer); mcp.stdout.off('data', onData); mcp.off('exit', onExit); }",
    "    function onExit(code) { cleanup(); reject(new Error(`MCP exited before response: ${code}${stderr ? `\\n${stderr}` : ''}`)); }",
    "    function onData(chunk) {",
    "      buffer += chunk.toString('utf8');",
    "      const lineEnd = buffer.indexOf('\\n');",
    "      if (lineEnd < 0) return;",
    "      const line = buffer.slice(0, lineEnd).trim();",
    "      buffer = buffer.slice(lineEnd + 1);",
    "      cleanup();",
    "      resolve(JSON.parse(line));",
    "    }",
    "    mcp.stdout.on('data', onData);",
    "    mcp.on('exit', onExit);",
    "  });",
    "}",
    "async function rpc(id, method, params = {}) {",
    "  mcp.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\\n`);",
    "  return waitForLine();",
    "}",
    "const initialized = await rpc(1, 'initialize');",
    "if (initialized.result?.serverInfo?.name !== '@slexkit/mcp') throw new Error('@slexkit/mcp initialize failed');",
    "const listed = await rpc(2, 'tools/list');",
    "const toolNames = listed.result?.tools?.map((tool) => tool.name).join(',');",
    "if (toolNames !== 'slexkitDocs,slexkitExamples,slexkitValidate') throw new Error('@slexkit/mcp tool list mismatch');",
    "const validated = await rpc(3, 'tools/call', { name: 'slexkitValidate', arguments: { source: '{ slex: \"0.1\", namespace: \"smoke\", layout: { \"text:message\": { text: \"ok\" } } }' } });",
    "if (validated.result?.structuredContent?.ok !== true) throw new Error('@slexkit/mcp validate smoke failed');",
    "mcp.kill();",
  ].join("\n"),
);

run("node", ["smoke.mjs"], { cwd: appDir, stdio: "inherit" });

console.log(`release smoke ok\npackDir=${packDir}\nappDir=${appDir}`);
