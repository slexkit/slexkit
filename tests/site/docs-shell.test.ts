import { describe, expect, it } from "bun:test";
import { createDocsPage } from "../../site/routes/docs-page.js";
import { createDocsShellProps } from "../../site/pages/docs.js";
import { normalizeSiteBase, stripSiteBase, withSiteBase } from "../../site/app/site-base.js";
import { normalizeRoutePath } from "../../site/app/site-routes.js";

describe("docs page module", () => {
  it("normalizes project-base routes", () => {
    expect(normalizeSiteBase("/slexkit")).toBe("/slexkit/");
    expect(stripSiteBase("/slexkit/docs/components/card", "/slexkit/")).toBe("/docs/components/card");
    expect(withSiteBase("/docs/components/card", "/slexkit/")).toBe("/slexkit/docs/components/card");
    expect(normalizeRoutePath("/slexkit/components/card", "/slexkit/")).toBe("/docs/components/card");
  });

  it("loads wiki docs from the static asset before the development API", async () => {
    const originalFetch = globalThis.fetch;
    const requests: string[] = [];
    globalThis.fetch = (async (input) => {
      requests.push(String(input));
      return new Response(JSON.stringify({ markdown: [{ kind: "guide", path: "content/guides/intro/en-US.md", content: "# Intro" }] }), { status: 200 });
    }) as typeof fetch;
    try {
      const page = await createDocsPage({ href: "/docs/guides/intro" });
      expect(page.doc?.href).toBe("/docs/guides/intro");
      expect(page.view.active).toBe("/docs/guides/intro");
      expect(requests).toEqual(["/assets/wiki-docs.json"]);
    } finally { globalThis.fetch = originalFetch; }
  });

  it("returns direct DocsShell props instead of a root DSL tree", () => {
    const props = createDocsShellProps({
      activeHref: "/docs/guides/quick-start",
      currentDoc: { slug: "quick-start", bodyHtml: '<div data-markdown-doc="quick-start"></div>' },
      docs: [{ id: "guides/quick-start", href: "/docs/guides/quick-start" }],
      playgroundHrefBase: "/slexkit/playground.html",
    });
    expect(props.active).toBe("/docs/guides/quick-start");
    expect(props.items).toHaveLength(1);
    expect(props.playgroundHrefBase).toBe("/slexkit/playground.html");
    expect(props).not.toHaveProperty("g");
    expect(props).not.toHaveProperty("layout");
  });
});
