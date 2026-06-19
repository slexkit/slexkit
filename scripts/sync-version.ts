import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

type PackageJson = {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
};

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf-8")) as T;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function syncSlexkitDependency(deps: Record<string, string> | undefined, version: string): void {
  if (!deps?.slexkit || deps.slexkit.startsWith("file:")) return;
  deps.slexkit = `^${version}`;
}

async function syncPackage(path: string, version: string): Promise<void> {
  const pkg = await readJson<PackageJson>(path);
  pkg.version = version;
  syncSlexkitDependency(pkg.dependencies, version);
  syncSlexkitDependency(pkg.peerDependencies, version);
  syncSlexkitDependency(pkg.devDependencies, version);
  await writeJson(path, pkg);
}

async function syncWorkspacePackages(version: string): Promise<void> {
  const packagesDir = join(root, "packages");
  for (const entry of await readdir(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    await syncPackage(join(packagesDir, entry.name, "package.json"), version);
  }
  await syncPackage(join(root, "site", "package.json"), version);
}

async function replaceInFile(path: string, replacements: Array<[RegExp, string]>): Promise<void> {
  const source = await readFile(path, "utf-8");
  const next = replacements.reduce((content, [pattern, replacement]) => content.replace(pattern, replacement), source);
  if (next !== source) await writeFile(path, next, "utf-8");
}

export async function syncVersion(): Promise<void> {
  const rootPackagePath = join(root, "package.json");
  const rootPackage = await readJson<PackageJson>(rootPackagePath);
  const version = rootPackage.version;
  if (!version) throw new Error("Root package.json is missing version.");

  await syncWorkspacePackages(version);
  await replaceInFile(join(root, "src", "version.ts"), [
    [/export const SLEXKIT_VERSION = ".*?";/, `export const SLEXKIT_VERSION = "${version}";`],
  ]);
  await replaceInFile(join(root, "packages", "streamdown", "src", "index.ts"), [
    [/const STREAMDOWN_RENDERER_VERSION = ".*?";/, `const STREAMDOWN_RENDERER_VERSION = "${version}";`],
  ]);
  await replaceInFile(join(root, "site", "app", "version.js"), [
    [/export const SLEXKIT_SITE_VERSION = ".*?";/, `export const SLEXKIT_SITE_VERSION = "${version}";`],
  ]);
}

if (import.meta.main) {
  await syncVersion();
}
