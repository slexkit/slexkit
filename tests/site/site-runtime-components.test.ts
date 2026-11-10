import { describe, expect, it } from "bun:test";

describe("site HTML runtime boundary", () => {
  it("keeps site navigation components in Svelte instead of registering them in artifact source", async () => {
    const main = await Bun.file("site/main.js").text();
    const docs = await Bun.file("site/routes/docs.js").text();
    const examples = await Bun.file("site/routes/examples.js").text();
    expect(main).not.toContain("registerSiteComponents");
    expect(main).not.toContain("registerAll");
    expect(docs).toContain('import DocsShell from "../components/DocsShell.svelte"');
    expect(examples).toContain('import DocsShell from "../components/DocsShell.svelte"');
    expect(docs).not.toContain("ingest(");
    expect(examples).not.toContain("ingest(");
  });

  it("does not register site-only visual components into generated HTML frames", async () => {
    const renderer = await Bun.file("site/markdown/svelte-renderer.js").text();
    expect(renderer).not.toContain("registerSiteComponents");
    expect(renderer).toContain("createSlexKitMarkdownRuntimeHost");
    expect(renderer).toContain("slexkit.runtime.js");
  });
});
