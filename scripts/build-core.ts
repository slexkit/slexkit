import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, compileModule } from "svelte/compiler";
import { fallbackThemeCss } from "../uno.config";
import { generateAiDocs } from "./generate-ai-docs";

const root = join(import.meta.dir, "..");
const dist = join(root, "dist");
const tmp = join(dist, ".tmp");
const themePackage = join(root, "packages", "theme-shadcn");
const unoCli = join(root, "node_modules", "@unocss", "cli", "bin", "unocss.mjs");
const flowbiteUnoGlobs = [
  "node_modules/flowbite-svelte/dist/accordion/**/*",
  "node_modules/flowbite-svelte/dist/context.*",
  "node_modules/flowbite-svelte/dist/tabs/**/*",
  "node_modules/flowbite-svelte/dist/theme/**/*",
  "node_modules/flowbite-svelte/dist/toast/**/*",
  "node_modules/flowbite-svelte/dist/utils/**/*",
];

async function run(command: string[], cwd = root) {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) throw new Error(`${command.join(" ")} failed with exit code ${code}`);
}

// ── JS builds ──────────────────────────────────────────────

function sharedRuntimeExternalPlugin(runtimeSpecifier: string): Bun.BunPlugin {
  const sharedRuntimeModules = new Set([
    "engine/registry",
    "engine/component-scope",
    "engine/index",
  ]);

  return {
    name: "slexkit-shared-runtime",
    setup(build) {
      build.onResolve({ filter: /\.\.\/.*engine\/(registry|component-scope|index)$/ }, ({ path }) => {
        const normalized = path.replace(/\\/g, "/").replace(/^(\.\.\/)+/, "");
        if (!sharedRuntimeModules.has(normalized)) return undefined;
        return {
          path: runtimeSpecifier,
          external: true,
        };
      });
    },
  };
}

async function buildJs(
  format: "esm" | "cjs",
  outfile: string,
  entrypoint: string,
  plugins: Bun.BunPlugin[] = [],
) {
  const result = await Bun.build({
    entrypoints: [join(root, entrypoint)],
    outfile: join(dist, outfile),
    target: "browser",
    format,
    bundle: true,
    write: true,
    plugins: [...plugins, sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error(`Bun failed to build ${outfile}`);
  }
  if (result.outputs.length > 0) {
    const output = result.outputs.find((item) => item.kind === "entry-point") ?? result.outputs[0];
    await writeFile(join(dist, outfile), await output.arrayBuffer());
  }
}

async function buildComponentEsms() {
  const entryDir = join(root, "src", "components", "entries");
  const files = (await readdir(entryDir)).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts"));

  const result = await Bun.build({
    entrypoints: files.map((f) => join(entryDir, f)),
    outdir: join(dist, "components"),
    target: "browser",
    format: "esm",
    bundle: true,
    splitting: true,
    naming: {
      entry: "[name].js",
      chunk: "../chunks/[name]-[hash].js",
    },
    write: true,
    plugins: [sharedRuntimeExternalPlugin("../runtime.js"), sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("Bun failed to build per-component ESM entries");
  }
}

async function buildComponentsIndex() {
  const result = await Bun.build({
    entrypoints: [join(root, "src", "components-svelte.ts")],
    outfile: join(dist, "components", "index.js"),
    target: "browser",
    format: "esm",
    bundle: true,
    write: true,
    plugins: [sharedRuntimeExternalPlugin("../runtime.js"), sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("Bun failed to build components index");
  }
  if (result.outputs.length > 0) {
    const output = result.outputs.find((item) => item.kind === "entry-point") ?? result.outputs[0];
    await writeFile(join(dist, "components", "index.js"), await output.arrayBuffer());
  }
}

async function rewriteSharedRuntimeImports(target: string, runtimeSpecifier: string): Promise<void> {
  const targetStat = await stat(target);
  if (targetStat.isFile()) {
    if (!target.endsWith(".js")) return;
    const source = await readFile(target, "utf-8");
    const next = source.replace(
      /from\s+["'](?:\.\.\/)+engine\/(?:registry|component-scope|index)["']/g,
      `from "${runtimeSpecifier}"`,
    );
    if (next !== source) await writeFile(target, next);
    return;
  }

  const entries = await readdir(target, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(target, entry.name);
    if (entry.isDirectory()) {
      await rewriteSharedRuntimeImports(path, runtimeSpecifier);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;

    const source = await readFile(path, "utf-8");
    const next = source.replace(
      /from\s+["'](?:\.\.\/)+engine\/(?:registry|component-scope|index)["']/g,
      `from "${runtimeSpecifier}"`,
    );
    if (next !== source) await writeFile(path, next);
  }
}

async function buildUmd(entrypoint: string, globalName: string, outfile: string) {
  await mkdir(tmp, { recursive: true });

  const result = await Bun.build({
    entrypoints: [join(root, entrypoint)],
    target: "browser",
    format: "iife",
    globalName: `__${globalName}_FACTORY__`,
    bundle: true,
    write: false,
    plugins: [sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error(`Failed to build UMD IIFE for ${outfile}`);
  }

  const output = result.outputs.find((item) => item.kind === "entry-point") ?? result.outputs[0];
  if (!output) throw new Error(`No output from IIFE build for ${outfile}`);

  let code = await output.text();

  const umd = [
    `(function(root, factory) {`,
    `  if (typeof define === "function" && define.amd) {`,
    `    define([], function() { return factory(); });`,
    `  } else if (typeof module === "object" && module.exports) {`,
    `    module.exports = factory();`,
    `  } else {`,
    `    root.${globalName} = factory();`,
    `  }`,
    `})(typeof self !== "undefined" ? self : this, function() {`,
    code.trim(),
    ``,
    `return typeof __${globalName}_FACTORY__ !== "undefined" ? __${globalName}_FACTORY__ : {};`,
    `});`,
  ].join("\n");

  await writeFile(join(dist, outfile), umd);
}

// ── Svelte plugin ──────────────────────────────────────────

function sveltePlugin(): Bun.BunPlugin {
  const svgRawFiles = new Map<string, string>();

  return {
    name: "svelte",
    setup(build) {
      build.onResolve({ filter: /^@humanspeak\/svelte-markdown$/ }, () => ({
        path: join(root, "node_modules", "@humanspeak", "svelte-markdown", "dist", "index.js"),
      }));
      build.onResolve({ filter: /^@humanspeak\/svelte-markdown\/extensions$/ }, () => ({
        path: join(root, "node_modules", "@humanspeak", "svelte-markdown", "dist", "extensions", "index.js"),
      }));
      build.onResolve({ filter: /\.svg\?raw$/ }, ({ path, importer }) => {
        const [specifier] = path.split("?", 1);
        const resolved = Bun.resolveSync(specifier, importer);
        const virtualPath = specifier.replace(/\\/g, "/");
        svgRawFiles.set(virtualPath, resolved);
        return { path: virtualPath, namespace: "svg-raw" };
      });
      build.onLoad({ filter: /.*/, namespace: "svg-raw" }, async ({ path }) => {
        const resolved = svgRawFiles.get(path) ?? fileURLToPath(path);
        return {
          contents: `export default ${JSON.stringify(await readFile(resolved, "utf-8"))};`,
          loader: "js",
        };
      });
      build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
        const source = await readFile(path, "utf-8");
        const result = compile(source, {
          filename: path,
          generate: "client",
          dev: false,
        });

        return {
          contents: result.js.code,
          loader: "js",
        };
      });
      build.onLoad({ filter: /\.svelte\.(js|ts)$/ }, async ({ path }) => {
        const source = await readFile(path, "utf-8");
        const result = compileModule(source, {
          filename: path,
          dev: false,
        });

        return {
          contents: result.js.code,
          loader: "js",
        };
      });
    },
  };
}

// ── CSS ────────────────────────────────────────────────────

async function buildCss() {
  await mkdir(tmp, { recursive: true });
  await mkdir(themePackage, { recursive: true });
  await rm(join(themePackage, "components"), { recursive: true, force: true });
  await mkdir(join(dist, "components"), { recursive: true });
  await mkdir(join(themePackage, "components"), { recursive: true });

  await run([
    "bun",
    unoCli,
    "-c",
    "uno.config.ts",
    "src/**/*.ts",
    "src/**/*.svelte",
    ...flowbiteUnoGlobs,
    "README.md",
    "-o",
    "dist/.tmp/uno.css",
  ]);

  const [unoCss, entryCss] = await Promise.all([
    readFile(join(tmp, "uno.css"), "utf-8"),
    bundleStyleFile("entry.css"),
  ]);
  const normalizedUnoCss = normalizeGeneratedCss(unoCss.trim());
  const css = `${normalizedUnoCss}\n\n${entryCss.trim()}\n`;
  const baseCss = `${fallbackThemeCss().trim()}\n\n${(await bundleBaseCss()).trim()}\n`;
  await writeFile(join(dist, "slexkit.css"), css);
  await writeFile(join(dist, "base.css"), baseCss);
  await writeFile(join(themePackage, "style.css"), css);
  await writeFile(join(themePackage, "base.css"), baseCss);
  await writeComponentCss();
  await rm(tmp, { recursive: true, force: true });
}

function normalizeGeneratedCss(css: string): string {
  return sortRootThemeVars(sortInlineCustomPropertyBlocks(css));
}

function sortInlineCustomPropertyBlocks(css: string): string {
  return css.replace(/\{((?:--[\w-]+:[^;{}]+;)+)\}/g, (block, declarations: string) => {
    const sorted = declarations.match(/--[\w-]+:[^;{}]+;/g)?.sort((a, b) => a.localeCompare(b));
    return sorted ? `{${sorted.join("")}}` : block;
  });
}

function sortRootThemeVars(css: string): string {
  return css.replace(/(:root, :host \{\n)([\s\S]*?)(\n\})/, (block, start: string, body: string, end: string) => {
    const lines = body.split("\n").filter(Boolean);
    if (lines.length === 0 || lines.some((line) => !line.startsWith("--"))) return block;
    return `${start}${lines.sort((a, b) => a.localeCompare(b)).join("\n")}${end}`;
  });
}

async function bundleStyleFile(file: string, seen = new Set<string>()): Promise<string> {
  if (seen.has(file)) return "";
  seen.add(file);
  const source = await readFile(join(root, "src/styles", file), "utf-8");
  const imports = [...source.matchAll(/@import\s+['"]\.\/([^'"]+)['"]\s*;/g)].map((match) => match[1]);
  const chunks = [];

  for (const importPath of imports) {
    chunks.push(`/* ${importPath} */`);
    chunks.push(await bundleStyleFile(importPath, seen));
  }

  chunks.push(source.replace(/@import\s+['"]\.\/[^'"]+['"]\s*;\s*/g, "").trim());
  return chunks.join("\n\n");
}

async function bundleBaseCss(): Promise<string> {
  const entry = await readFile(join(root, "src/styles", "entry.css"), "utf-8");
  const entryTail = entry.replace(/@import\s+['"]\.\/[^'"]+['"]\s*;\s*/g, "").trim();
  const chunks = [
    "/* layout.css */",
    await bundleStyleFile("layout.css"),
    "/* theme.css */",
    await bundleStyleFile("theme.css"),
    "/* animation.css */",
    await bundleStyleFile("animation.css"),
  ];
  if (entryTail) chunks.push("/* entry.css */", entryTail);
  return chunks.join("\n\n");
}

async function writeComponentCss(): Promise<void> {
  const componentFiles = await readdir(join(root, "src/styles", "components"));
  const directFiles = ["tooling.css", "display.css", "content.css", "disclosure.css", "feedback.css"];
  const writes: Promise<void>[] = [];

  for (const file of componentFiles.filter((name) => name.endsWith(".css")).sort()) {
    const css = `${(await bundleStyleFile(`components/${file}`)).trim()}\n`;
    writes.push(writeFile(join(dist, "components", file), css));
    writes.push(writeFile(join(themePackage, "components", file), css));
  }

  for (const file of directFiles) {
    const css = `${(await bundleStyleFile(file)).trim()}\n`;
    writes.push(writeFile(join(dist, "components", file), css));
    writes.push(writeFile(join(themePackage, "components", file), css));
  }

  const inputCss = `${(await bundleStyleFile("input.css")).trim()}\n`;
  writes.push(writeFile(join(dist, "components", "input.css"), inputCss));
  writes.push(writeFile(join(themePackage, "components", "input.css"), inputCss));

  await Promise.all(writes);
}

// ── TypeScript declarations ────────────────────────────────

async function buildTypes() {
  await run(["tsc", "-p", "tsconfig.build.json"]);
  for await (const file of new Bun.Glob("dist/types/**/*.spec.d.ts").scan(root)) {
    await rm(join(root, file), { force: true });
  }
}

async function writeComponentEntryStubs() {
  const entryDir = join(root, "src", "components", "entries");
  const files = (await readdir(entryDir)).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts"));
  const typesDir = join(dist, "types", "components");

  await mkdir(typesDir, { recursive: true });

  for (const file of files) {
    const name = file.replace(/\.ts$/, "");
    await writeFile(join(typesDir, `${name}.d.ts`), `// Type stub: importing this module registers the "${name}" component type.\nexport {};\n`);
  }
}

// ── Main ───────────────────────────────────────────────────

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(join(dist, "umd"), { recursive: true });
await mkdir(join(dist, "components"), { recursive: true });
await mkdir(join(dist, "chunks"), { recursive: true });

// Aggregated bundles (engine + all 25 non-tooling components)
await Promise.all([
  buildJs("esm", "slexkit.js", "src/index.ts"),
  buildJs("cjs", "slexkit.cjs", "src/index.ts"),
]);

// Runtime-only bundles (engine, no components)
await Promise.all([
  buildJs("esm", "runtime.js", "src/runtime.ts"),
  buildJs("cjs", "runtime.cjs", "src/runtime.ts"),
]);

// Tooling bundle (Playground only, registers into the root bundle via side effect)
await buildJs("esm", "tooling.js", "src/components/tooling.ts", [
  sharedRuntimeExternalPlugin("./slexkit.js"),
]);
await rewriteSharedRuntimeImports(join(dist, "tooling.js"), "./slexkit.js");

// Per-component ESM entries (tree-shaking friendly, code-split via chunks/)
await buildComponentEsms();
await buildComponentsIndex();
await rewriteSharedRuntimeImports(join(dist, "components"), "../runtime.js");
await rewriteSharedRuntimeImports(join(dist, "chunks"), "../runtime.js");

// UMD bundles
await buildUmd("src/index.ts", "SlexKit", "umd/slexkit.umd.js");
await buildUmd("src/tooling-umd.ts", "SlexKit", "umd/slexkit.tooling.umd.js");

// CSS
await buildCss();

// TypeScript declarations
await buildTypes();

// Generate stub .d.ts for per-component entries
await writeComponentEntryStubs();

// AI/agent docs for package consumers and the MCP package.
await generateAiDocs({ outputDirs: [join(dist, "ai")] });
