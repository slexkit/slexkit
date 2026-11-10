import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";

const root = resolve(import.meta.dir, "..");
const output = resolve(root, "test-results/html-candidate");
const plugin = resolve(root, "../obsidian-slexkit");
await mkdir(output, { recursive: true });
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const readJson = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const pkg = await readJson(join(root, "package.json"));
const verification = await readJson(join(output, "verification.json"));
if (verification.kind !== "html-candidate-verification" || !verification.passed)
  throw new Error("Run bun run verify:html-candidate successfully before writing acceptance.");
const run = await readJson(join(root, "test-results/html-migration/run.json"));
if (run.kind !== "html-migration-conformance" || run.status !== "passed")
  throw new Error("Run current HTML behavior conformance successfully before packaging.");
for (const [path, expected] of Object.entries(run.artifactHashes ?? {}))
  if (hash(await readFile(join(root, path))) !== expected)
    throw new Error(`Acceptance artifact changed: ${path}; rerun conformance.`);
if (!Object.keys(run.artifactHashes ?? {}).length)
  throw new Error("Conformance report lacks artifact hashes; rerun the current orchestrator.");
const build = await readJson(join(plugin, "runtime-build.json"));
if (build.protocolVersion !== "html-1" || build.runtimeVersion !== pkg.version ||
    build.runtimeSha256 !== hash(await readFile(join(root, "dist/slexkit.js"))) ||
    build.frameRuntimeSha256 !== hash(await readFile(join(root, "dist/runtime.js"))))
  throw new Error("Obsidian embeds a different runtime; repack, pin and rebuild it first.");

const modules = [".", "packages/runtime", "packages/components-svelte", "packages/theme-shadcn",
  "packages/streamdown", "packages/assistant-ui", "packages/tiptap", "packages/mcp", "../obsidian-slexkit"];
const dependencies: Record<string, unknown> = {};
for (const module of modules) {
  const directory = resolve(root, module);
  const metadata = await readJson(join(directory, "package.json"));
  dependencies[metadata.name] = { version: metadata.version, dependencies: metadata.dependencies ?? {},
    peerDependencies: metadata.peerDependencies ?? {} };
  const rootArchive = join(output, `slexkit-${pkg.version}.tgz`);
  if (module === "." && await Bun.file(rootArchive).exists()) {
    for (const path of ["dist/slexkit.js", "dist/runtime.js", "dist/slexkit.css"]) {
      const tar = Bun.spawn(["tar", "-xOf", rootArchive, `package/${path}`], { stdout: "pipe", stderr: "pipe" });
      const [bytes, code] = await Promise.all([new Response(tar.stdout).arrayBuffer(), tar.exited]);
      if (code || hash(new Uint8Array(bytes)) !== hash(await readFile(join(root, path))))
        throw new Error(`Root archive differs from current ${path}; repack and rebuild the pinned plugin first.`);
    }
    continue;
  }
  const process = Bun.spawn(["bun", "pm", "pack", "--destination", output], {
    cwd: directory, stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  await writeFile(join(output, `${metadata.name.replace(/[@/]/g, "-")}-pack.log`), stdout + stderr);
  if (code) throw new Error(`Packing ${metadata.name} failed: ${stderr}`);
}

const assets: Array<{ path: string; raw: number; gzip: number; sha256: string }> = [];
for (const path of ["dist/slexkit.js", "dist/runtime.js", "dist/web-components.js", "dist/tooling.js", "dist/slexkit.cjs", "dist/slexkit.css", "../obsidian-slexkit/main.js", "../obsidian-slexkit/styles.css"]) {
  const bytes = await readFile(resolve(root, path));
  assets.push({ path, raw: bytes.length, gzip: gzipSync(bytes).length, sha256: hash(bytes) });
}
const archives = [];
for (const file of await readdir(output)) {
  if (!file.endsWith(".tgz")) continue;
  const bytes = await readFile(join(output, file));
  archives.push({ file, bytes: bytes.length, sha256: hash(bytes) });
}
const fontFiles = await readdir(join(root, "dist/fonts"));
let fontBytes = 0;
for (const file of fontFiles) fontBytes += (await readFile(join(root, "dist/fonts", file))).length;
let desktop: Record<string, unknown> = { status: "pending", reason: "Real Obsidian desktop acceptance has not been recorded for this runtime." };
try { desktop = await readJson(join(root, "test-results/html-migration/obsidian/report.json")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
if (desktop.runtimeSha256 !== build.runtimeSha256 || desktop.frameRuntimeSha256 !== build.frameRuntimeSha256)
  desktop = { status: "pending", reason: "Desktop evidence does not identify the currently embedded runtime." };
const summary = { createdAt: new Date().toISOString(), version: pkg.version, protocol: "html-1",
  status: desktop.status === "passed" ? "locally-accepted-candidate" : "candidate-awaiting-desktop-acceptance",
  verification, conformance: run, desktop, assets, fonts: { files: fontFiles.length, raw: fontBytes }, archives, dependencies,
  obsidianBuild: build,
  limitations: ["Iframe self-navigation can issue network requests; CSP is not a complete egress firewall.",
    "Arbitrary infinite code requires external process controls; heartbeats do not provide CPU preemption.",
    "Arbitrary closures/DOM objects/external side effects are not serializable or transactionally reversible.",
    "No model-generation success, token savings, public release or real Android acceptance is claimed."] };
await writeFile(join(output, "report.json"), JSON.stringify(summary, null, 2) + "\n");
const rows = assets.map(asset => `| ${asset.path} | ${asset.raw.toLocaleString("en-US")} | ${asset.gzip.toLocaleString("en-US")} |`).join("\n");
const report = `# SlexKit 0.5 HTML / Web Components 候选验收\n\n状态：${summary.status}。协议：html-1。仅本地产物，未提交、推送或发布。\n\n` +
  `默认 slex fence 已改为 HTML、CSS、标准 JavaScript 和 slex-* 自定义元素。旧 g/layout DSL 被拒绝；默认组件 28 个，Playground 为可选注册组件。\n\n` +
  `## 验证\n\n- 三浏览器行为验收：${run.results.length} 项，${run.status}。\n- Obsidian 桌面：${desktop.status}。\n- 详细命令、操作、版本和结果见 [行为记录](../html-migration/run.json)、[桌面记录](../html-migration/obsidian/report.json) 及同目录 JSON/日志/截图。\n\n` +
  `## 实际体积\n\n| 文件 | raw bytes | gzip bytes |\n| --- | ---: | ---: |\n${rows}\n\n` +
  `独立字体资源 ${fontFiles.length} 个，共 ${fontBytes.toLocaleString("en-US")} bytes。root/runtime 分别自包含，两者不是应同时加载的体积。Obsidian 包内含离线运行时、样式与字体。解析器仍在默认宿主包内；独立组件入口不包含旧 DSL 求值器。\n\n` +
  `## 兼容性与边界\n\n旧对象源码、表达式字符串、事件语句属性和 g namespace 状态模型均退出。保留的薄包装包、部分方法名和模式选项不代表旧语法兼容。交互逻辑使用原生事件/属性/slot；跨 fence 状态通过显式 artifact-local JSON 契约。\n\n` +
  summary.limitations.map(value => `- ${value}`).join("\n") + "\n\n原始哈希、依赖、压缩包清单及完整结果见 [report.json](./report.json)。\n";
await writeFile(join(output, "REPORT.md"), report);
await copyFile(join(plugin, "runtime-build.json"), join(output, "obsidian-runtime-build.json"));
console.log(JSON.stringify({ status: summary.status, output: relative(root, output), archives: archives.length }));
