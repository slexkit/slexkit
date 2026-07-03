import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadSlexKitRuntime } from "../../site/markdown/runtime-loader.js";

describe("site markdown runtime components", () => {
  it("registers site-only visual components on the dynamically loaded runtime", async () => {
    globalThis.__SLEXKIT_RUNTIME_URL__ = pathToFileURL(join(import.meta.dir, "../../dist/slexkit.js")).href;
    document.body.innerHTML = '<div id="app"></div>';

    const runtime = await loadSlexKitRuntime();
    runtime.mount(
      {
        namespace: "site_visual_components",
        layout: {
          "swatch:primary": { tone: "primary" },
          "diagram:philosophy": {},
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-swatch")?.getAttribute("data-tone")).toBe("primary");
    expect(document.querySelector(".slex-diagram")?.getAttribute("data-kind")).toBe("philosophy");
  });

  it("applies design-doc visual rules in the unified docs shell", async () => {
    const css = await Bun.file("site/styles/site-components.css").text();
    const renderer = await Bun.file("site/markdown/svelte-renderer.js").text();

    expect(css).toContain('.slex-docs-markdown[data-markdown-doc="design"]');
    expect(css).toContain(".slex-doc-slexkit-demo .slex-card .slex-swatch");
    expect(css).toContain('.slex-diagram[data-kind="philosophy"] + .slex-grid');
    expect(renderer).toContain("registerSiteComponents");
    expect(renderer).toContain("ensureSiteComponentsRegistered");
  });
});
