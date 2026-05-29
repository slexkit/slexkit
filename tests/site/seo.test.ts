import { describe, expect, it } from "bun:test";
import {
  createSeoIndex,
  injectSeoHead,
  renderRobotsTxt,
  renderSitemapXml,
} from "../../site/data/seo.js";

describe("site SEO metadata", () => {
  it("builds page metadata from localized docs", async () => {
    const seo = await createSeoIndex({ siteRoot: "site" });
    const intro = seo.pageForPath("/docs/guides/intro");
    const zhIntro = seo.pageForPath("/zh-CN/docs/guides/intro");

    expect(intro).toMatchObject({
      path: "/docs/guides/intro",
      locale: "en-US",
      title: "SlexKit Introduction - SlexKit",
      kind: "article",
      canonicalPath: "/docs/guides/intro",
    });
    expect(intro.description).toContain("Markdown-friendly reactive UI runtime");
    expect(zhIntro).toMatchObject({
      path: "/zh-CN/docs/guides/intro",
      locale: "zh-CN",
      canonicalPath: "/zh-CN/docs/guides/intro",
    });
  });

  it("injects crawlable title, description, canonical, social, and alternate tags", async () => {
    const seo = await createSeoIndex({ siteRoot: "site" });
    const html = injectSeoHead(
      "<!doctype html><html><head><title>SlexKit</title></head><body></body></html>",
      seo.pageForPath("/docs/components/button"),
      { publicBaseUrl: "https://slexkit.github.io/slexkit/" },
    );

    expect(html).toContain("<title>Button - SlexKit</title>");
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('rel="canonical" href="https://slexkit.github.io/slexkit/docs/components/button"');
    expect(html).toContain('hreflang="en-US" href="https://slexkit.github.io/slexkit/docs/components/button"');
    expect(html).toContain('hreflang="zh-CN" href="https://slexkit.github.io/slexkit/zh-CN/docs/components/button"');
    expect(html).toContain('property="og:title" content="Button - SlexKit"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('property="og:image" content="https://slexkit.github.io/slexkit/og.svg"');
  });

  it("renders robots and sitemap entries with locale alternates", async () => {
    const seo = await createSeoIndex({ siteRoot: "site" });
    const publicBaseUrl = "https://slexkit.github.io/slexkit/";
    const robots = renderRobotsTxt({ publicBaseUrl });
    const sitemap = renderSitemapXml(seo.pages, { publicBaseUrl });

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Sitemap: https://slexkit.github.io/slexkit/sitemap.xml");
    expect(sitemap).toContain("<loc>https://slexkit.github.io/slexkit/docs/guides/intro</loc>");
    expect(sitemap).toContain('hreflang="zh-CN" href="https://slexkit.github.io/slexkit/zh-CN/docs/guides/intro"');
    expect(sitemap).not.toContain(".md</loc>");
  });
});
