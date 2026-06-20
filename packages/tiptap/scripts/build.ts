import { rm } from "node:fs/promises";
import { join } from "node:path";

const packageRoot = join(import.meta.dir, "..");

await rm(join(packageRoot, "dist"), { recursive: true, force: true });

const proc = Bun.spawn(["tsc", "-p", "tsconfig.build.json"], {
  cwd: packageRoot,
  stdout: "inherit",
  stderr: "inherit",
});

const code = await proc.exited;
if (code !== 0) throw new Error(`tsc -p tsconfig.build.json failed with exit code ${code}`);
