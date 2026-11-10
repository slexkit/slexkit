import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, compileModule } from "svelte/compiler";
const root = join(import.meta.dir, "..");

export function sveltePlugin(): Bun.BunPlugin {
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
