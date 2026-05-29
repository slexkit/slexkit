import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { generateAiDocs } from "../../../scripts/generate-ai-docs";

const packageRoot = join(import.meta.dir, "..");
const repoRoot = join(packageRoot, "..", "..");
const dist = join(packageRoot, "dist");
const dataDir = join(dist, "data");

await rm(dist, { recursive: true, force: true });
await mkdir(dataDir, { recursive: true });
await generateAiDocs({ outputDirs: [join(repoRoot, "dist", "ai")] });

const result = await Bun.build({
  entrypoints: [join(packageRoot, "src", "index.ts")],
  outdir: dist,
  target: "bun",
  format: "esm",
  sourcemap: "external",
  write: true,
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  throw new Error("Bun failed to build MCP server");
}

for (const file of [
  "slexkit-ai-manifest.json",
  "llms.txt",
  "llms-full.txt",
  "llms-components.txt",
  "llms-runtime.txt",
  "llms-toolhost.txt",
  "llms-authoring.txt",
]) {
  await copyFile(join(repoRoot, "dist", "ai", file), join(dataDir, file));
}
