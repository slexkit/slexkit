import { describe, expect, it } from "bun:test";
import { describeSlexElements } from "../../src/web-components";

describe("page structure migration boundary", () => {
  it("keeps site-only page, hero, toc, catalog, prose, and docs-shell components out of runtime", () => {
    const tags = describeSlexElements().map(item => item.tagName);
    for (const siteOnly of ["slex-page", "slex-hero", "slex-toc", "slex-catalog", "slex-prose", "slex-docs-shell"])
      expect(tags).not.toContain(siteOnly);
  });
});
