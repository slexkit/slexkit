import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function runCli(args: string[]) {
  const result = Bun.spawnSync(["node", "scripts/cli.mjs", ...args], { stdout: "pipe", stderr: "pipe" });
  return {
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout),
    stderr: new TextDecoder().decode(result.stderr),
  };
}

describe("HTML runtime and component entries", () => {
  it("exports one HTML runtime from root and runtime entries", async () => {
    const root = await import("../../src/index");
    const runtime = await import("../../src/runtime");
    for (const entry of [root, runtime]) {
      expect(typeof entry.mount).toBe("function");
      expect(typeof entry.inspectSlexSource).toBe("function");
      expect(typeof entry.defineSlexElements).toBe("function");
      expect(entry.inspectSlexSource("<slex-text></slex-text>").ok).toBe(true);
      expect(entry.inspectSlexSource({ layout: {} }).ok).toBe(false);
      expect(entry).not.toHaveProperty("disposeNamespace");
      expect(entry).not.toHaveProperty("getRenderer");
    }
  });

  it("keeps components-svelte as a Web Components compatibility wrapper", async () => {
    const components = await import("../../src/components-svelte");
    expect(components.registerAll).toBe(components.defineSlexElements);
    expect(components.describeSlexElements().map(item => item.tagName)).toContain("slex-input");
  });

  it("keeps scoped wrappers and public HTML/component exports aligned", async () => {
    const [rootPackage, runtimePackage, componentsPackage, themePackage, runtimeEntry, componentsEntry] = await Promise.all([
      readFile("package.json", "utf8").then(JSON.parse),
      readFile("packages/runtime/package.json", "utf8").then(JSON.parse),
      readFile("packages/components-svelte/package.json", "utf8").then(JSON.parse),
      readFile("packages/theme-shadcn/package.json", "utf8").then(JSON.parse),
      readFile("packages/runtime/index.js", "utf8"),
      readFile("packages/components-svelte/index.js", "utf8"),
    ]);
    expect(runtimePackage.peerDependencies.slexkit).toBe(`^${rootPackage.version}`);
    expect(componentsPackage.peerDependencies.slexkit).toBe(`^${rootPackage.version}`);
    expect(runtimeEntry).toContain('from "slexkit/runtime"');
    expect(componentsEntry).toContain('from "slexkit/components"');
    expect(rootPackage.exports["./web-components"]).toBeTruthy();
    expect(rootPackage.exports["./style.css"]).toBe("./dist/slexkit.css");
    expect(themePackage.exports["./style.css"]).toBe("./style.css");
  });

  it("keeps every scoped package aligned for release packaging metadata", async () => {
    const rootPackage = await readFile("package.json", "utf8").then(JSON.parse);
    for (const dir of ["runtime", "components-svelte", "theme-shadcn", "streamdown", "assistant-ui", "tiptap", "mcp"]) {
      const packageJson = await readFile(`packages/${dir}/package.json`, "utf8").then(JSON.parse);
      expect(packageJson.name).toBe(`@slexkit/${dir}`);
      // The published 0.5.0 assistant adapter needs a peer-dependency fix;
      // npm versions are immutable, so that one package advances a patch.
      const expectedVersion = dir === "assistant-ui" && rootPackage.version === "0.5.0"
        ? "0.5.1"
        : rootPackage.version;
      expect(packageJson.version).toBe(expectedVersion);
      expect(packageJson.license).toBe("MIT");
      expect(packageJson.files).toContain("README.md");
      expect(existsSync(`packages/${dir}/LICENSE`)).toBe(true);
    }
  });

  it("exports package versions without the retired DSL protocol helpers", async () => {
    const packageJson = await readFile("package.json", "utf8").then(JSON.parse);
    const root = await import("../../src/index");
    expect(root.SLEXKIT_VERSION).toBe(packageJson.version);
    expect(root.SLEXKIT_COMPONENTS_VERSION).toBe(packageJson.version);
    expect(root).not.toHaveProperty("runSlexConformance");
    expect(root).not.toHaveProperty("parseSlexStreamingSource");
  });

  it("validates HTML files and warnings through the CLI without executing scripts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "slexkit-html-cli-"));
    try {
      const validPath = join(directory, "valid.slex.html");
      await writeFile(validPath, '<slex-text text="ok"></slex-text><script>process.exit(71)</script>');
      const valid = runCli(["validate", validPath, "--json"]);
      expect(valid.exitCode, valid.stderr).toBe(0);
      expect(JSON.parse(valid.stdout).ok).toBe(true);
      const warningPath = join(directory, "warning.slex.html");
      await writeFile(warningPath, "<section><div>streaming");
      expect(runCli(["validate", warningPath, "--strict", "--json"]).exitCode).toBe(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("requires the CLI runtime copy path to use the HTML bundle and adjacent CSS", async () => {
    const source = await readFile("scripts/cli.mjs", "utf8");
    expect(source).toContain('resolve(packageRoot, "dist", "slexkit.js")');
    expect(source).toContain('resolve(packageRoot, "dist", "slexkit.css")');
  });

  it("keeps test-only component entries out of the public build", async () => {
    const build = await readFile("scripts/build-core.ts", "utf8");
    expect(build).toContain('new Bun.Glob("dist/types/**/*.spec.d.ts")');
    expect(build).not.toContain('entrypoints: ["src/components/entries/playground.spec.ts"]');
  });
});
