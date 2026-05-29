import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const packageRoot = join(import.meta.dir, "..");
const root = join(packageRoot, "..", "..");
const dist = join(packageRoot, "dist");
const coreCssPath = join(root, "dist", "slexkit.css");

async function run(command: string[], cwd = root): Promise<void> {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) throw new Error(`${command.join(" ")} failed with exit code ${code}`);
}

async function ensureCoreBuild(): Promise<void> {
  if (existsSync(coreCssPath) && existsSync(join(root, "dist", "slexkit.js"))) return;
  await run(["bun", "run", "build:core"]);
}

async function buildMain(): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(packageRoot, "src", "main.ts")],
    outfile: join(dist, "main.js"),
    target: "browser",
    format: "cjs",
    write: true,
    external: ["obsidian"],
    plugins: [{
      name: "local-slexkit-runtime",
      setup(build) {
        build.onResolve({ filter: /^slexkit$/ }, () => ({
          path: join(root, "dist", "slexkit.js"),
        }));
      },
    }],
    minify: true,
    sourcemap: "external",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("Bun failed to build Obsidian plugin main.js");
  }

  const output = result.outputs.find((item) => item.kind === "entry-point") ?? result.outputs[0];
  if (!output) throw new Error("Bun did not return an Obsidian plugin bundle.");
  const bundle = `${await output.text()}
var SlexKitObsidianPlugin = module.exports.default || module.exports;
module.exports = SlexKitObsidianPlugin;
module.exports.default = SlexKitObsidianPlugin;
`;
  await writeFile(join(dist, "main.js"), bundle);
}

async function buildStyles(): Promise<void> {
  const [coreCss, obsidianCss] = await Promise.all([
    readFile(coreCssPath, "utf-8"),
    readFile(join(packageRoot, "styles.css"), "utf-8"),
  ]);
  await writeFile(
    join(dist, "styles.css"),
    `${coreCss.trim()}\n\n/* Obsidian host bridge */\n${obsidianCss.trim()}\n`,
  );
}

async function buildManifest(): Promise<void> {
  const [rootPackageText, manifestText] = await Promise.all([
    readFile(join(root, "package.json"), "utf-8"),
    readFile(join(packageRoot, "manifest.json"), "utf-8"),
  ]);
  const rootPackage = JSON.parse(rootPackageText) as { version?: string };
  const manifest = JSON.parse(manifestText) as { version?: string };
  if (!rootPackage.version) throw new Error("Root package.json is missing version.");
  manifest.version = rootPackage.version;
  await writeFile(join(dist, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

await ensureCoreBuild();
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await Promise.all([
  buildMain(),
  buildStyles(),
  buildManifest(),
]);
