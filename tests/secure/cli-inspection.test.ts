import { expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

it("CLI validates HTML without executing scripts and strict mode rejects warnings", async () => {
  const directory = await mkdtemp(join(tmpdir(), "slex-html-inspection-"));
  const validFile = join(directory, "source.slex.html");
  const warningFile = join(directory, "warning.slex.html");
  await writeFile(validFile, '<div>safe</div><script>process.exit(71);while(true){}</script>');
  await writeFile(warningFile, "<section><div>streaming");
  try {
    const valid = Bun.spawn(["node", "scripts/cli.mjs", "validate", validFile, "--json"], {
      stdout: "pipe", stderr: "pipe",
    });
    const validOutput = await new Response(valid.stdout).json();
    expect(await valid.exited).toBe(0);
    expect(validOutput.ok).toBe(true);

    const strict = Bun.spawn(["node", "scripts/cli.mjs", "validate", warningFile, "--strict", "--json"], {
      stdout: "pipe", stderr: "pipe",
    });
    const strictOutput = await new Response(strict.stdout).json();
    expect(await strict.exited).toBe(1);
    expect(strictOutput.warnings.length).toBeGreaterThan(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 10_000);
