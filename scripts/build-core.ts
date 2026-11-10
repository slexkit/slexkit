import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sveltePlugin } from "./svelte-plugin";
import { publicBuildEntry } from "./public-entry";
import { fallbackThemeCss } from "../uno.config";
import { generateAiDocs } from "./generate-ai-docs";
import { generateStandardArtifacts } from "./generate-standard-artifacts";
import { writeCustomElementsManifest } from "./custom-elements-manifest";

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

async function buildJs(
  format: "esm" | "cjs",
  outfile: string,
  entrypoint: string,
  plugins: Bun.BunPlugin[] = [],
) {
  const result = await Bun.build({
    entrypoints: [entrypoint === "src/index.ts" || entrypoint === "src/runtime.ts" || entrypoint === "src/components/tooling.ts" ? await publicBuildEntry(root, outfile, entrypoint) : join(root, entrypoint)],
    outfile: join(dist, outfile),
    target: "browser",
    format,
    bundle: true,
    write: true,
    plugins: [...plugins, sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
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
  const { describeSlexElements } = await import(join(dist, "web-components.js"));
  for (const { tagName } of describeSlexElements()) {
    const type = tagName.slice(5);
    await writeFile(join(dist, "components", `${type}.js`),
      `import { defineSlexElements } from "../web-components.js";\nexport const define = (options = {}) => defineSlexElements({ ...options, components: [${JSON.stringify(type)}] });\nif (typeof window !== "undefined") define();\n`);
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
    plugins: [sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
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

async function buildUmd(entrypoint: string, globalName: string, outfile: string) {
  await mkdir(tmp, { recursive: true });

  const result = await Bun.build({
    entrypoints: [await publicBuildEntry(root, outfile.replaceAll("/", "-"), entrypoint)],
    target: "browser",
    format: "iife",
    globalName: `__${globalName}_FACTORY__`,
    bundle: true,
    write: false,
    plugins: [sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
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
  const formulaCss = await readFile(join(root, "node_modules", "katex", "dist", "katex.min.css"), "utf8");
  const css = `${normalizedUnoCss}\n\n${formulaCss}\n\n${entryCss.trim()}\n`;
  await mkdir(join(dist, "fonts"), { recursive: true });
  for (const font of await readdir(join(root, "node_modules", "katex", "dist", "fonts"))) {
    await copyFile(join(root, "node_modules", "katex", "dist", "fonts", font), join(dist, "fonts", font));
  }
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
  const { describeSlexElements } = await import(join(dist, "web-components.js"));
  const typesDir = join(dist, "types", "components");

  await mkdir(typesDir, { recursive: true });

  for (const { tagName } of describeSlexElements()) {
    const name = tagName.slice(5);
    await writeFile(join(typesDir, `${name}.d.ts`), `import type { DefineSlexElementsOptions } from "../web-components";\nexport declare const define: (options?: DefineSlexElementsOptions) => void;\n`);
  }
}

// ── Main ───────────────────────────────────────────────────

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(join(dist, "umd"), { recursive: true });
await mkdir(join(dist, "components"), { recursive: true });
await mkdir(join(dist, "chunks"), { recursive: true });

// Default HTML document host with the approved Web Components.
await Promise.all([
  buildJs("esm", "slexkit.js", "src/index.ts"),
  buildJs("cjs", "slexkit.cjs", "src/index.ts"),
]);

// Runtime aliases include the approved components required by iframe bootstrap.
await Promise.all([
  buildJs("esm", "runtime.js", "src/runtime.ts"),
  buildJs("cjs", "runtime.cjs", "src/runtime.ts"),
]);

// Standard HTML/JS entry, independent of the Slex parser and evaluator.
await buildJs("esm", "web-components.js", "src/web-components.ts");
await writeCustomElementsManifest(root, dist);

// Optional authoring UI, explicitly registered with host-owned asset options.
await buildJs("esm", "tooling.js", "src/components/tooling.ts");

// Per-component registration entries share the standalone Web Components bundle.
await buildComponentEsms();
await buildComponentsIndex();

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
await generateStandardArtifacts({ outputDirs: [join(dist, "standard")] });
