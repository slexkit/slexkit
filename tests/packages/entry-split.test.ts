import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { disposeNamespace, mount } from "../../src/runtime";

async function sleep(ms = 40): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

describe("split runtime and Svelte component entries", () => {
  it("keeps the runtime entry component-free until Svelte components are loaded", async () => {
    document.body.innerHTML = '<div id="runtime-only"></div><div id="with-components"></div>';

    mount({
      namespace: "entry_split_runtime_only",
      g: {},
      layout: {
        "text:message": { text: "Runtime only" },
      },
    }, document.getElementById("runtime-only")!);

    expect(document.querySelector("#runtime-only .slexkit-root")).toBeTruthy();
    expect(document.querySelector("#runtime-only .slex-text")).toBeNull();

    await import("../../src/components-svelte");

    mount({
      namespace: "entry_split_components",
      g: {},
      layout: {
        "text:message": { text: "With components" },
      },
    }, document.getElementById("with-components")!);

    expect(document.querySelector("#with-components .slex-text")?.textContent).toBe("With components");

    disposeNamespace("entry_split_runtime_only");
    disposeNamespace("entry_split_components");
  });

  it("registers published per-component entries into the published runtime entry", async () => {
    document.body.innerHTML = '<div id="published-components"></div>';

    const runtime = await import("../../dist/runtime.js");
    await import("../../dist/components/text.js");

    runtime.mount({
      namespace: "published_entry_split_components",
      g: {},
      layout: {
        "text:message": { text: "Published component" },
      },
    }, document.getElementById("published-components")!);

    expect(document.querySelector("#published-components .slex-text")?.textContent).toBe("Published component");

    runtime.disposeNamespace("published_entry_split_components");
  });

  it("registers the published tooling entry into the published root bundle", async () => {
    document.body.innerHTML = '<div id="published-tooling"></div>';

    const slexkit = await import("../../dist/slexkit.js");
    await import("../../dist/tooling.js");

    const cleanup = slexkit.mount({
      namespace: "published_entry_split_tooling",
      g: {},
      layout: {
        "playground:inline": {
          mode: "render",
          previewMinHeight: "120px",
          source: `{
            namespace: "published_entry_split_tooling_inner",
            layout: { "text:message": { text: "Tooling component" } }
          }`,
          sourceType: "slex",
        },
      },
    }, document.getElementById("published-tooling")!);

    await sleep();

    expect(document.querySelector("#published-tooling .slex-playground")).toBeTruthy();
    expect(document.querySelector("#published-tooling .slex-playground-preview-pane")?.textContent).toContain("Tooling component");

    cleanup();
    slexkit.disposeNamespace("published_entry_split_tooling");
  });

  it("keeps scoped package wrappers on the root split entries", async () => {
    const [rootPackage, runtimePackage, componentsPackage, streamdownPackage, themePackage, runtimeEntry, componentsEntry] = await Promise.all([
      readFile("package.json", "utf-8").then(JSON.parse),
      readFile("packages/runtime/package.json", "utf-8").then(JSON.parse),
      readFile("packages/components-svelte/package.json", "utf-8").then(JSON.parse),
      readFile("packages/streamdown/package.json", "utf-8").then(JSON.parse),
      readFile("packages/theme-shadcn/package.json", "utf-8").then(JSON.parse),
      readFile("packages/runtime/index.js", "utf-8"),
      readFile("packages/components-svelte/index.js", "utf-8"),
    ]);

    expect(runtimePackage.name).toBe("@slexkit/runtime");
    expect(componentsPackage.name).toBe("@slexkit/components-svelte");
    expect(themePackage.name).toBe("@slexkit/theme-shadcn");
    expect(runtimePackage.peerDependencies.slexkit).toBe(`^${rootPackage.version}`);
    expect(componentsPackage.peerDependencies.slexkit).toBe(`^${rootPackage.version}`);
    expect(streamdownPackage.peerDependencies.slexkit).toBe(`^${rootPackage.version}`);
    expect(runtimePackage.peerDependenciesMeta?.slexkit?.optional).toBe(true);
    expect(componentsPackage.peerDependenciesMeta?.slexkit?.optional).toBe(true);
    expect(streamdownPackage.peerDependenciesMeta?.slexkit?.optional).toBe(true);
    expect(runtimeEntry).toContain('from "slexkit/runtime"');
    expect(componentsEntry).toContain('from "slexkit/components"');
    expect(componentsEntry).not.toContain("registerSiteComponents");
    expect(rootPackage.exports["./style.css"]).toBe("./dist/slexkit.css");
    expect(rootPackage.exports["./base.css"]).toBe("./dist/base.css");
    expect(rootPackage.exports["./components/*.css"]).toBe("./dist/components/*.css");
    expect(themePackage.exports["./style.css"]).toBe("./style.css");
    expect(themePackage.exports["./base.css"]).toBe("./base.css");
    expect(themePackage.exports["./components/*.css"]).toBe("./components/*.css");
  });

  it("keeps every scoped package aligned for release packaging", async () => {
    const rootPackage = await readFile("package.json", "utf-8").then(JSON.parse) as {
      bugs?: { url?: string };
      homepage?: string;
      repository?: { type?: string; url?: string };
      version: string;
    };
    const packageDirs = [
      "runtime",
      "components-svelte",
      "theme-shadcn",
      "streamdown",
      "obsidian",
      "mcp",
    ];

    for (const dir of packageDirs) {
      const packageJson = await readFile(`packages/${dir}/package.json`, "utf-8").then(JSON.parse) as {
        bugs?: { url?: string };
        homepage?: string;
        name: string;
        version: string;
        files?: string[];
        license?: string;
        publishConfig?: { access?: string };
        repository?: { type?: string; url?: string; directory?: string };
      };

      expect(packageJson.name).toBe(`@slexkit/${dir}`);
      expect(packageJson.version).toBe(rootPackage.version);
      expect(packageJson.license).toBe("MIT");
      expect(packageJson.publishConfig?.access).toBe("public");
      expect(packageJson.repository?.type).toBe("git");
      expect(packageJson.repository?.url).toBe(rootPackage.repository?.url);
      expect(packageJson.repository?.directory).toBe(`packages/${dir}`);
      expect(packageJson.homepage).toContain(`packages/${dir}`);
      expect(packageJson.bugs?.url).toBe(rootPackage.bugs?.url);
      expect(packageJson.files).toContain("README.md");
      expect(packageJson.files).toContain("LICENSE");
      expect(existsSync(`packages/${dir}/README.md`)).toBe(true);
      expect(existsSync(`packages/${dir}/LICENSE`)).toBe(true);
    }

    expect(existsSync("packages/obsidian/dist/main.js")).toBe(true);
    expect(existsSync("packages/obsidian/dist/manifest.json")).toBe(true);
    expect(existsSync("packages/obsidian/dist/styles.css")).toBe(true);
    expect(existsSync("packages/mcp/dist/index.js")).toBe(true);
    expect(existsSync("packages/mcp/dist/data/slexkit-ai-manifest.json")).toBe(true);
    expect(rootPackage.repository?.type).toBe("git");
    expect(rootPackage.repository?.url).toContain("github.com/slexkit/slexkit");
    expect(rootPackage.homepage).toContain("github.com/slexkit/slexkit");
    expect(rootPackage.bugs?.url).toContain("github.com/slexkit/slexkit/issues");
  });

  it("exports package and protocol version information from public entries", async () => {
    const rootPackage = await readFile("package.json", "utf-8").then(JSON.parse) as { version: string };
    const root = await import("../../dist/slexkit.js");
    const runtime = await import("../../dist/runtime.js");
    const siteVersion = await import("../../site/app/version.js");

    expect(root.SLEXKIT_VERSION).toBe(rootPackage.version);
    expect(root.SLEXKIT_COMPONENTS_VERSION).toBe(rootPackage.version);
    expect(root.SLEX_PROTOCOL_VERSION).toBe("0.1");
    expect(root.getSlexKitInfo()).toEqual({
      version: rootPackage.version,
      protocolVersion: "0.1",
      componentsVersion: rootPackage.version,
    });
    expect(runtime.SLEXKIT_VERSION).toBe(rootPackage.version);
    expect(runtime.getSlexKitInfo()).toEqual(root.getSlexKitInfo());
    expect(siteVersion.SLEXKIT_SITE_VERSION).toBe(rootPackage.version);
    expect(siteVersion.SLEX_PROTOCOL_VERSION).toBe("0.1");
  });

  it("copies the built runtime module through the published CLI", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "slexkit-cli-"));
    const target = join(tempDir, "slexkit.runtime.js");
    try {
      await Bun.$`node scripts/cli.mjs copy-runtime ${target}`;
      const [sourceInfo, targetInfo, source, copied] = await Promise.all([
        stat("dist/runtime.js"),
        stat(target),
        readFile("dist/runtime.js", "utf-8"),
        readFile(target, "utf-8"),
      ]);

      expect(targetInfo.size).toBe(sourceInfo.size);
      expect(copied).toBe(source);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("keeps test-only component entries out of the public build", async () => {
    const [componentFiles, chunkFiles, typeFiles] = await Promise.all([
      Array.fromAsync(new Bun.Glob("dist/components/**/*.spec.js").scan(".")),
      Array.fromAsync(new Bun.Glob("dist/chunks/**/*.spec-*.js").scan(".")),
      Array.fromAsync(new Bun.Glob("dist/types/**/*.spec.d.ts").scan(".")),
    ]);

    expect(componentFiles).toEqual([]);
    expect(chunkFiles).toEqual([]);
    expect(typeFiles).toEqual([]);
  });
});
