import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const sourcePath = join(root, "CHANGELOG.md");
const targetPath = join(root, "site", "content", "releases", "changelog", "en-US.md");

function normalizeBody(source: string): string {
  return source.replace(/^\uFEFF/, "").trim();
}

export async function syncChangelog(): Promise<void> {
  const body = normalizeBody(await readFile(sourcePath, "utf-8"));
  const content = [
    "---",
    "title: Changelog",
    "category: Releases",
    "status: ready",
    "order: 10",
    'summary: "Release notes and notable changes for SlexKit."',
    "slexkitRenderMode: component",
    "---",
    "",
    body,
    "",
  ].join("\n");

  await mkdir(join(root, "site", "content", "releases", "changelog"), { recursive: true });
  await writeFile(targetPath, content, "utf-8");
}

if (import.meta.main) {
  await syncChangelog();
}
