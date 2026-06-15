import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { compile, compileModule } from "svelte/compiler";
import { exportComponentSpecManifest, supportedLocales } from "../data/component-docs.js";
import { discoverExampleMarkdown, discoverWikiMarkdown } from "../data/content-discovery.js";

import { copyFile } from "node:fs/promises";

const siteRoot = join(import.meta.dir, "..");
const projectRoot = join(siteRoot, "..");
const outDir = join(siteRoot, ".bun-dist");
const unoCli =
  [
    join(siteRoot, "node_modules", "@unocss", "cli", "bin", "unocss.mjs"),
    join(projectRoot, "node_modules", "@unocss", "cli", "bin", "unocss.mjs"),
  ].find((path) => existsSync(path)) ?? join(siteRoot, "node_modules", "@unocss", "cli", "bin", "unocss.mjs");

function bunPath(path: string): string {
  return path.replaceAll("\\", "/");
}

async function run(command: string[], cwd = siteRoot) {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) throw new Error(`${command.join(" ")} failed with exit code ${code}`);
}

export async function buildSiteAssets({ clean = true } = {}) {
  if (clean) await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [bunPath(join(siteRoot, "main.js")), bunPath(join(siteRoot, "playground.js")), bunPath(join(siteRoot, "main.css"))],
    outdir: bunPath(outDir),
    target: "browser",
    format: "esm",
    splitting: true,
    sourcemap: "linked",
    plugins: [siteAliasPlugin(), sveltePlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
    },
    naming: {
      entry: "[dir]/[name].[ext]",
      chunk: "chunks/[name]-[hash].[ext]",
      asset: "[name].[ext]",
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("Bun failed to build site bundle");
  }

  await writeStaticWikiDocs();

  await copyFile(join(siteRoot, "assets", "logo.svg"), join(outDir, "logo.svg"));

  await run([
    "bun",
    unoCli,
    "-c",
    "../uno.config.ts",
    "index.html",
    "playground.html",
    "main.js",
    "playground.js",
    "app/**/*.js",
    "components/**/*.svelte",
    "styles/**/*.css",
    "data/**/*.js",
    "pages/**/*.js",
    "playground/**/*.js",
    "routes/**/*.js",
    "content/**/*.md",
    "../node_modules/flowbite-svelte/dist/sidebar/**/*",
    "../node_modules/flowbite-svelte/dist/theme/**/*",
    "../node_modules/flowbite-svelte/dist/utils/**/*",
    "-o",
    ".bun-dist/uno.css",
  ]);
  await sanitizeGeneratedCssSources(join(outDir, "uno.css"));
}

async function writeStaticWikiDocs() {
  await writeFile(join(outDir, "wiki-docs.json"), JSON.stringify({ markdown: await discoverWikiMarkdown({ siteRoot }) }), "utf-8");
  await writeFile(
    join(outDir, "examples-docs.json"),
    JSON.stringify({ markdown: (await Promise.all(supportedLocales.map((locale) => discoverExampleMarkdown({ siteRoot, locale })))).flat() }),
    "utf-8",
  );
  await mkdir(join(outDir, "spec"), { recursive: true });
  for (const locale of supportedLocales) {
    await writeFile(
      join(outDir, "spec", `components.${locale}.json`),
      JSON.stringify(exportComponentSpecManifest(locale)),
      "utf-8",
    );
  }
}

function siteAliasPlugin(): Bun.BunPlugin {
  const virtualCssFiles = new Map<string, string>();

  return {
    name: "slexkit-site-aliases",
    setup(build) {
      build.onResolve({ filter: /^slexkit$/ }, () => ({
        path: join(projectRoot, "dist", "slexkit.js"),
      }));
      build.onResolve({ filter: /^slexkit\/dist\/style\.css$/ }, () => ({
        path: join(projectRoot, "dist", "slexkit.css"),
      }));
      build.onResolve({ filter: /^slexkit\/components$/ }, () => ({
        path: join(projectRoot, "dist", "components", "index.js"),
      }));
      build.onResolve({ filter: /^slexkit\/components\/(.*)\.css$/ }, (args) => ({
        path: join(projectRoot, "dist", "components", `${args.captures[0]}.css`),
      }));
      build.onResolve({ filter: /^katex\/dist\/katex\.min\.css$/ }, () => ({
        path: "katex/dist/katex.min.css",
        namespace: "katex-css",
      }));
      virtualCssFiles.set("katex/dist/katex.min.css", join(projectRoot, "node_modules", "katex", "dist", "katex.min.css"));
      build.onLoad({ filter: /katex\.min\.css$/, namespace: "katex-css" }, async ({ path }) => {
        const resolved = virtualCssFiles.get(path) ?? path;
        return {
          contents: stripFontFaces(await readFile(resolved, "utf-8")),
          loader: "css",
        };
      });
      build.onResolve({ filter: /^[^./].*/ }, async ({ path }) => {
        if (path.includes("?raw")) return undefined;
        const resolved = await resolveSitePackage(path);
        return resolved ? { path: bunPath(resolved) } : undefined;
      });
    },
  };
}

async function resolveSitePackage(specifier: string): Promise<string | null> {
  const parts = specifier.split("/");
  const isScoped = specifier.startsWith("@");
  const packageName = isScoped ? parts.slice(0, 2).join("/") : parts[0];
  const subpath = parts.slice(isScoped ? 2 : 1).join("/");
  const packageRoots = [
    join(siteRoot, "node_modules", packageName),
    join(projectRoot, "node_modules", packageName),
    join(projectRoot, "node_modules", ".bun", "node_modules", packageName),
  ];

  for (const packageRoot of packageRoots) {
    try {
      const manifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf-8"));
      if (subpath) {
        const exportEntry = manifest.exports?.[`./${subpath}`];
        const exported = resolveExportEntry(exportEntry);
        if (exported) return join(packageRoot, exported);
        return resolvePackageFile(join(packageRoot, subpath));
      }

      const exportEntry = resolveExportEntry(manifest.exports) ?? resolveExportEntry(manifest.exports?.["."]);
      if (exportEntry) return join(packageRoot, exportEntry);
      if (manifest.module) return join(packageRoot, manifest.module);
      if (manifest.main) return join(packageRoot, manifest.main);
    } catch {
      continue;
    }
  }

  return null;
}

function resolvePackageFile(path: string): string {
  if (existsSync(path)) return path;
  if (existsSync(`${path}.js`)) return `${path}.js`;
  if (existsSync(join(path, "index.js"))) return join(path, "index.js");
  return path;
}

function resolveExportEntry(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const record = entry as Record<string, unknown>;
  return (
    resolveExportEntry(record.browser) ??
    resolveExportEntry(record.import) ??
    resolveExportEntry(record.svelte) ??
    resolveExportEntry(record.default)
  );
}

function sveltePlugin(): Bun.BunPlugin {
  const svgRawFiles = new Map<string, string>();

  return {
    name: "svelte",
    setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, ({ path, importer }) => {
        const [specifier] = path.split("?", 1);
        const resolved = Bun.resolveSync(specifier, importer);
        const virtualPath = specifier.replace(/\\/g, "/");
        svgRawFiles.set(virtualPath, resolved);
        return { path: virtualPath, namespace: "svg-raw" };
      });
      build.onLoad({ filter: /.*/, namespace: "svg-raw" }, async ({ path }) => {
        const resolved = svgRawFiles.get(path) ?? path;
        return {
          contents: `export default ${JSON.stringify(await readFile(resolved, "utf-8"))};`,
          loader: "js",
        };
      });
      build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
        const source = replaceImportMetaEnv(await readFile(path, "utf-8"));
        const result = compile(source, {
          filename: path,
          generate: "client",
          dev: false,
        });

        return {
          contents: replaceImportMetaEnv(result.js.code),
          loader: "js",
        };
      });
      build.onLoad({ filter: /\.svelte\.(js|ts)$/ }, async ({ path }) => {
        const source = replaceImportMetaEnv(await readFile(path, "utf-8"));
        const result = compileModule(source, {
          filename: path,
          dev: false,
        });

        return {
          contents: replaceImportMetaEnv(result.js.code),
          loader: "js",
        };
      });
    },
  };
}

function replaceImportMetaEnv(source: string): string {
  return source
    .replaceAll("import.meta.env.DEV", "false")
    .replaceAll("import.meta.env.PROD", "true")
    .replaceAll("import.meta.env?.DEV", "false")
    .replaceAll("import.meta.env?.PROD", "true");
}

function stripFontFaces(source: string): string {
  return source.replaceAll(/@font-face\{[^}]*\}/g, "");
}

async function sanitizeGeneratedCssSources(file: string): Promise<void> {
  const source = await readFile(file, "utf-8");
  const rootPrefixes = [
    `${bunPath(projectRoot)}/`,
    `${projectRoot}\\`,
  ];
  let next = source;
  for (const prefix of rootPrefixes) {
    next = next.replaceAll(prefix, "");
  }
  if (next !== source) await writeFile(file, next);
}

if (import.meta.main) {
  await buildSiteAssets();
}
