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

const proc = Bun.spawn(["tsc", "-p", "tsconfig.build.json"], {
  cwd: packageRoot,
  stdout: "inherit",
  stderr: "inherit",
});

const code = await proc.exited;
if (code !== 0) throw new Error(`tsc -p tsconfig.build.json failed with exit code ${code}`);

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
