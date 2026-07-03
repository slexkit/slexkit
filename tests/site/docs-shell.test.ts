import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { createDocsPage as createDocsVmPage } from "../../site/routes/docs-page.js";
import { normalizeSiteBase, stripSiteBase, withSiteBase } from "../../site/app/site-base.js";
import { normalizeRoutePath } from "../../site/app/site-routes.js";
import { createPage as createDocsPage } from "../../site/pages/docs.slex.js";

describe("docs page module", () => {
  it("normalizes GitHub Pages project paths into internal routes", () => {
    expect(normalizeSiteBase("/slexkit")).toBe("/slexkit/");
    expect(stripSiteBase("/slexkit/docs/components/column", "/slexkit/")).toBe("/docs/components/column");
    expect(withSiteBase("/docs/components/column", "/slexkit/")).toBe("/slexkit/docs/components/column");
    expect(normalizeRoutePath("/slexkit/components", "/slexkit/")).toBe("/docs/components/accordion");
    expect(normalizeRoutePath("/slexkit/components/column", "/slexkit/")).toBe("/docs/components/column");
    expect(withSiteBase(normalizeRoutePath("/slexkit/components/column", "/slexkit/"), "/slexkit/")).toBe(
      "/slexkit/docs/components/column",
    );
    expect(withSiteBase("/docs/components/column.md", "/slexkit/")).toBe("/slexkit/docs/components/column.md");
  });

  it("keeps custom-domain root exports unprefixed", async () => {
    expect(normalizeSiteBase("/")).toBe("/");
    expect(stripSiteBase("/docs/components/column", "/")).toBe("/docs/components/column");
    expect(withSiteBase("/assets/main.js", "/")).toBe("/assets/main.js");
    expect(withSiteBase("/slexkit/assets/main.js", "/")).toBe("/slexkit/assets/main.js");

    const workflow = await readFile(".github/workflows/pages.yml", "utf-8");
    expect(workflow).toContain("SITE_BASE: /");
    expect(workflow).toContain("SITE_URL: https://slexkit.dev/");
  });

  it("loads wiki docs from the static asset before the dev API", async () => {
    const originalFetch = globalThis.fetch;
    const requests: string[] = [];
    globalThis.fetch = (async (input) => {
      requests.push(String(input));
      if (String(input) === "/assets/wiki-docs.json") {
        return new Response(
          JSON.stringify({
            markdown: [
              {
                kind: "guide",
                path: "content/guides/intro/en-US.md",
                content: "# Intro\n\n## Start",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch;

    try {
      const page = await createDocsVmPage({ href: "/docs/guides/intro" });
      expect(page.doc?.href).toBe("/docs/guides/intro");
      expect(requests).toEqual(["/assets/wiki-docs.json"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("defines the single docs wiki shell", async () => {
    const page = createDocsPage({
      activeHref: "/docs/guides/quick-start",
      currentDoc: {
        slug: "quick-start",
        markdownHref: "/docs/guides/quick-start.md",
        bodyHtml: '<div data-markdown-doc="quick-start"></div>',
      },
      docs: [
        { id: "guides/intro", title: "SlexKit 简介", group: "Guides", href: "/docs/guides/intro" },
        { id: "guides/quick-start", title: "开始使用", group: "Guides", href: "/docs/guides/quick-start" },
        { id: "guides/integration", title: "集成", group: "Guides", href: "/docs/guides/integration" },
        { id: "components/column", title: "Column", group: "Components", href: "/docs/components/column" },
      ],
    });
    const markdown = await Bun.file("site/content/guides/quick-start/zh-CN.md").text();

    expect(page.g.activeHref).toBe("/docs/guides/quick-start");
    expect(Object.keys(page.layout)).toEqual(["docs-shell:site"]);
    expect(page.layout["docs-shell:site"].$doc).toBe("g.doc");
    expect(page.g.doc.markdownHref).toBe("/docs/guides/quick-start.md");
    expect(page.g.doc.bodyHtml).toBe('<div data-markdown-doc="quick-start"></div>');
    expect(page.g.docs.map((item) => item.href)).toContain("/docs/components/column");
    expect(page.g.docs.map((item) => item.href)).toContain("/docs/guides/integration");
    expect(markdown).toContain("# 开始使用");
    expect(markdown).toContain("## 安装入口");
    expect(markdown).toContain("## Markdown 宿主");
    expect(markdown).toContain("## 内容来源");
    expect(markdown).toContain("[集成](integration)");
    expect(markdown).toContain("createSlexKitMarkdownRuntimeHost");

    const integrationMarkdown = await Bun.file("site/content/guides/integration/zh-CN.md").text();
    expect(integrationMarkdown).toContain("# 集成");
    expect(integrationMarkdown).toContain("@slexkit/streamdown");
    expect(integrationMarkdown).toContain("slexkit/obsidian-slexkit");
    expect(integrationMarkdown).toContain("createSlexKitRenderer");
    expect(integrationMarkdown).toContain("Obsidian");

    const securityMarkdown = await Bun.file("site/content/guides/security-runtime/zh-CN.md").text();
    expect(securityMarkdown).toContain("HostRuntimePolicy");
    expect(securityMarkdown).toContain("allow-same-origin");
    expect(securityMarkdown).toContain("安全运行时契约");
    expect(securityMarkdown).toContain("createSlexKitMarkdownRuntimeHost");
    expect(securityMarkdown).toContain("上线检查");
  });
});

describe("design guide content", () => {
  it("keeps the design guide public, markdown-first, and aligned with component specs", async () => {
    const markdown = await Bun.file("site/content/guides/design/zh-CN.md").text();

    expect(markdown).toContain('namespace: "design_philosophy"');
    expect(markdown).toContain('"diagram:philosophy"');
    expect(markdown).toContain('"swatch:primary"');
    expect(markdown).toContain('"stat:passed"');
    expect(markdown).toContain('"heading:title"');
    expect(markdown).toContain("```slex");
    expect(markdown).toContain('tone: "primary"');
    expect(markdown).toContain('tone: "destructive"');
    expect(markdown).toContain('tone: "neutral"');
    expect(markdown).toContain('tone: "info"');
    expect(markdown).toContain('tone: "success"');
    expect(markdown).toContain('tone: "warning"');
    expect(markdown).toContain('tone: "danger"');
    expect(markdown).toContain('tone: "muted"');
    expect(markdown).toContain("展示 UI");
    expect(markdown).toContain("ToolHost");
    expect(markdown).not.toContain("class:");
    expect(markdown).not.toContain("variant:");
    expect(markdown).not.toContain("slex-visual--arrange");
  });
});
