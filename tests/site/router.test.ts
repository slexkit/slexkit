import { describe, expect, it } from "bun:test";
import {
  currentLocale,
  docHrefForPath,
  localizeSiteNavigationPath,
  navHref,
  pathWithoutLocale,
  switchLocalePath,
} from "../../site/app/router.js";
import { normalizeRoutePath } from "../../site/app/site-routes.js";

function setPath(path: string) {
  window.history.pushState({}, "", path);
}

describe("site locale routing", () => {
  it("normalizes legacy docs routes without dropping locale prefixes", () => {
    expect(normalizeRoutePath("/slexkit/en-US/components/column", "/slexkit/")).toBe(
      "/en-US/docs/components/column",
    );
    expect(normalizeRoutePath("/slexkit/en-US/components", "/slexkit/")).toBe(
      "/en-US/docs/components/accordion",
    );
    expect(normalizeRoutePath("/slexkit/en-US/docs/ai-agents", "/slexkit/")).toBe(
      "/en-US/docs/guides/ai-agents",
    );
    expect(normalizeRoutePath("/slexkit/docs/spec", "/slexkit/")).toBe("/docs/reference/spec");
    expect(normalizeRoutePath("/slexkit/changelog", "/slexkit/")).toBe("/docs/releases/changelog");
    expect(normalizeRoutePath("/slexkit/index.html", "/slexkit/")).toBe("/");
    expect(normalizeRoutePath("/slexkit/en-US/index.html", "/slexkit/")).toBe("/en-US/");
  });

  it("switches locale on canonical and legacy routes in place", () => {
    expect(switchLocalePath("en-US", "/zh-CN/docs/components/card")).toBe("/docs/components/card");
    expect(switchLocalePath("zh-CN", "/docs/components/card")).toBe("/zh-CN/docs/components/card");
    expect(switchLocalePath("en-US", "/zh-CN/components/card")).toBe("/docs/components/card");
    expect(switchLocalePath("zh-CN", "/components/card")).toBe("/zh-CN/docs/components/card");
  });

  it("inherits the active locale for unlocalized in-app links", () => {
    setPath("/zh-CN/docs/components/card");

    expect(currentLocale()).toBe("zh-CN");
    expect(pathWithoutLocale()).toBe("/docs/components/card");
    expect(docHrefForPath()).toBe("/zh-CN/docs/components/card");
    expect(navHref("/")).toBe("/zh-CN/");
    expect(localizeSiteNavigationPath("/")).toBe("/zh-CN/");
    expect(localizeSiteNavigationPath("/docs/guides/intro")).toBe("/zh-CN/docs/guides/intro");
    expect(localizeSiteNavigationPath("/components")).toBe("/zh-CN/docs/components/accordion");
    expect(localizeSiteNavigationPath("/components/card")).toBe("/zh-CN/docs/components/card");
    expect(localizeSiteNavigationPath("/docs/components/card.md")).toBe("/docs/components/card.md");
  });

  it("keeps explicit locale links explicit and canonicalizes the default locale", () => {
    setPath("/zh-CN/docs/components/card");

    expect(localizeSiteNavigationPath("/zh-CN/docs/guides/intro")).toBe("/zh-CN/docs/guides/intro");
    expect(localizeSiteNavigationPath("/en-US/docs/guides/intro")).toBe("/docs/guides/intro");
  });
});
