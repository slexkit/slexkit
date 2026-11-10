import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateAiDocs } from "../../../scripts/generate-ai-docs";
import { generateStandardArtifacts } from "../../../scripts/generate-standard-artifacts";
import { SLEX_STANDARD_ARTIFACTS } from "../../../src/standard/artifacts";

const packageRoot = join(import.meta.dir, "..");
const repoRoot = join(packageRoot, "..", "..");
const dist = join(packageRoot, "dist");
const dataDir = join(dist, "data");
const standardDataDir = join(dataDir, "standard");

await rm(dist, { recursive: true, force: true });
await mkdir(dataDir, { recursive: true });
await generateAiDocs({ outputDirs: [join(repoRoot, "dist", "ai")] });
await generateStandardArtifacts({ outputDirs: [join(repoRoot, "dist", "standard")] });

const result = await Bun.build({
  entrypoints: [join(packageRoot, "src", "index.ts")],
  outdir: dist,
  target: "bun",
  format: "esm",
  sourcemap: "external",
  write: true,
  plugins: [{
    name: "html-static-inspector",
    setup(build) {
      build.onResolve({ filter: /^slexkit\/runtime$/ }, () => ({
        path: join(repoRoot, "src", "html", "inspect.ts"),
      }));
    },
  }],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  throw new Error("Bun failed to build MCP server");
}

// The package is a stdio executable and intentionally has no library API.
// Keep the declared types export valid for package managers that resolve it.
await writeFile(join(dist, "index.d.ts"), "export {};\n", "utf8");

for (const file of [
  "slexkit-ai-manifest.json",
  "llms.txt",
  "llms-full.txt",
  "llms-components.txt",
  "llms-runtime.txt",
  "llms-capabilities.txt",
  "llms-toolhost.txt",
  "llms-authoring.txt",
]) {
  await copyFile(join(repoRoot, "dist", "ai", file), join(dataDir, file));
}

await mkdir(standardDataDir, { recursive: true });
for (const file of SLEX_STANDARD_ARTIFACTS) {
  await copyFile(join(repoRoot, "dist", "standard", file), join(standardDataDir, file));
}
