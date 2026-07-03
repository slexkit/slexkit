import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createStandardArtifacts,
  SLEX_STANDARD_ARTIFACTS,
  type SlexStandardBuild,
} from "../src/standard/artifacts";

const root = join(import.meta.dir, "..");

async function readPackageVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf-8")) as { version?: string };
  return packageJson.version ?? "0.0.0";
}

export async function generateStandardArtifacts(
  options: { outputDirs?: string[]; generatedAt?: string } = {},
): Promise<SlexStandardBuild> {
  const build = createStandardArtifacts(await readPackageVersion(), options.generatedAt);
  const outputDirs = options.outputDirs ?? [join(root, "dist", "standard")];

  for (const dir of outputDirs) {
    await mkdir(dir, { recursive: true });
    await Promise.all(
      SLEX_STANDARD_ARTIFACTS.map((filename) => writeFile(join(dir, filename), build.files[filename], "utf-8")),
    );
  }

  return build;
}

if (import.meta.main) {
  await generateStandardArtifacts();
}
