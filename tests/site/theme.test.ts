import { describe, expect, it } from "bun:test";
import { colors } from "@unocss/preset-wind4/colors";
import { fallbackThemeCss } from "../../uno.config";
import { createMobileNav } from "../../site/app/mobile-nav.js";
import { createSiteShell } from "../../site/app/shell.js";
import { applySiteTheme, initSiteTheme } from "../../site/app/theme.js";

function resetThemeDom() {
  window.localStorage.clear();
  document.body.innerHTML = "";
  document.documentElement.className = "light";
  document.documentElement.removeAttribute("data-theme");
}

describe("site dark mode", () => {
  it("initializes from persisted theme and toggles with persistence", () => {
    resetThemeDom();
    window.localStorage.setItem("slexkit:theme", "dark");
    const button = document.createElement("button");
    document.body.append(button);

    initSiteTheme(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");

    button.click();
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("slexkit:theme")).toBe("light");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("can apply a dark theme without a theme button for standalone playground", () => {
    resetThemeDom();
    const mode = applySiteTheme("dark");

    expect(mode).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("ships dark color-scheme and complete state tokens in the uno theme", () => {
    const css = fallbackThemeCss();

    expect(css).toContain("color-scheme: light;");
    expect(css).toContain("color-scheme: dark;");
    expect(css).toContain("--info:");
    expect(css).toContain("--info-foreground:");
    expect(css).toContain("--success:");
    expect(css).toContain("--success-foreground:");
    expect(css).toContain("--warning:");
    expect(css).toContain("--warning-foreground:");
    expect(css).toContain("--destructive:");
    expect(css).toContain("--destructive-foreground:");
    expect(css).toContain("--slex-primary-950:");
  });

  it("uses the restrained emerald success token in light and dark themes", () => {
    const css = fallbackThemeCss();

    expect(css).toContain(`--success: ${colors.emerald[600]};`);
    expect(css).toContain(`--success: ${colors.emerald[400]};`);
  });

  it("keeps playground html on the shared theme path", async () => {
    const html = await Bun.file("site/playground.html").text();
    const script = await Bun.file("site/playground.js").text();

    expect(html).toContain('localStorage.getItem("slexkit:theme")');
    expect(script).toContain('from "./app/theme.js"');
    expect(script).toContain("initSiteTheme()");
  });

  it("uses sun and moon icons for the global site theme button", async () => {
    const html = await Bun.file("site/index.html").text();
    const css = await Bun.file("site/styles/docs-shell.css").text();

    expect(html).toContain('data-phosphor-icon="moon"');
    expect(html).toContain('data-phosphor-icon="sun"');
    expect(html).not.toContain('data-phosphor-icon="circle-half"');
    expect(css).toContain(".slex-theme-icon--light");
    expect(css).toContain(".slex-theme-icon--dark");
    expect(css).toContain(".dark #themeBtn .slex-theme-icon--light");
    expect(css).toContain(".dark #themeBtn .slex-theme-icon--dark");
  });

  it("keeps raw markdown links on tokenized docs link semantics", async () => {
    const css = await Bun.file("site/styles/docs-shell.css").text();

    expect(css).toContain(".slex-doc-prose :where(a:not([class]))");
    expect(css).toContain(".slex-static-prose :where(a:not([class]))");
    expect(css).toContain("color: color-mix(in oklab, var(--primary) 88%, var(--foreground));");
    expect(css).toContain("text-decoration-color: color-mix(in oklab, var(--primary) 42%, transparent);");
    expect(css).toContain(".slex-doc-prose :where(a:not([class]):hover)");
    expect(css).toContain(".slex-doc-prose :where(a:not([class]):focus-visible)");
  });

  it("places a language menu after the global theme button", async () => {
    const html = await Bun.file("site/index.html").text();
    const main = await Bun.file("site/main.js").text();
    const router = await Bun.file("site/app/router.js").text();
    const shell = await Bun.file("site/app/shell.js").text();

    const themeIndex = html.indexOf('id="themeBtn"');
    const languageIndex = html.indexOf('id="languageTrigger"');
    expect(themeIndex).toBeGreaterThan(-1);
    expect(languageIndex).toBeGreaterThan(themeIndex);
    expect(html).toContain('data-phosphor-icon="translate"');
    expect(html).not.toContain('data-phosphor-icon="caret-down"');
    expect(html).toContain('id="languageMenu"');
    expect(html).toContain('data-locale="zh-CN"');
    expect(html).toContain('data-locale="en-US"');
    expect(html.match(/data-home-link/g)).toHaveLength(2);
    expect(main).toContain("createSiteShell");
    expect(router).toContain("function switchLocalePath");
    expect(router).toContain("function localizeSiteNavigationPath");
    expect(shell).toContain('languageTrigger?.addEventListener("click"');
    expect(shell).toContain('languageMenu?.addEventListener("click"');
    expect(shell).toContain("data-home-link");
  });

  it("localizes global shell controls from the active locale", () => {
    resetThemeDom();
    globalThis.HTMLAnchorElement ||= window.HTMLAnchorElement;
    document.body.innerHTML = `
      <button id="themeBtn" type="button"></button>
      <button id="languageTrigger" type="button" aria-expanded="false"></button>
      <div id="languageMenu" role="listbox"></div>
      <button id="navMenuBtn" type="button" aria-expanded="false"></button>
      <button type="button" data-mobile-nav-close></button>
      <a data-home-link></a>
      <a data-nav-link data-nav-section="guides"></a>
      <a data-nav-link data-nav-section="examples"></a>
      <a data-nav-link data-nav-section="components"></a>
    `;

    const shell = createSiteShell({
      defaultLocale: "en-US",
      docHrefForPath: () => "/docs/guides/intro",
      currentLocale: () => "zh-CN",
      isDocsRoute: () => false,
      isExamplesRoute: () => false,
      localizedPath: (path: string) => ({ locale: "zh-CN", path }),
      navHref: (path: string) => `/zh-CN${path === "/" ? "" : path}`,
      renderRoute: async () => {},
      routePath: (path: string) => path,
      switchLocalePath: () => "/",
      withSiteBase: (path: string) => path,
    });

    shell.syncLanguageControls();

    expect(document.getElementById("themeBtn")?.getAttribute("aria-label")).toBe("切换主题");
    expect(document.getElementById("languageTrigger")?.getAttribute("aria-label")).toBe("语言");
    expect(document.getElementById("languageMenu")?.getAttribute("aria-label")).toBe("语言");
    expect(document.getElementById("navMenuBtn")?.getAttribute("aria-label")).toBe("打开导航");
    expect(document.querySelector("[data-mobile-nav-close]")?.getAttribute("aria-label")).toBe("关闭菜单");
    expect(Array.from(document.querySelectorAll("[data-nav-link]")).map((node) => node.textContent)).toEqual([
      "简介",
      "示例",
      "组件",
    ]);
  });

  it("keeps mobile navigation trigger labels aligned with open state", () => {
    resetThemeDom();
    document.body.innerHTML = `
      <button id="navMenuBtn" type="button" aria-expanded="false">
        <span data-phosphor-icon="list"></span>
      </button>
      <div id="mobileNav" data-open="false" aria-hidden="true">
        <button type="button" data-mobile-nav-close></button>
        <div data-mobile-nav-panel></div>
        <div data-mobile-nav-context></div>
        <a data-mobile-nav-link href="/zh-CN/docs/guides/intro">Intro</a>
      </div>
    `;
    const nav = createMobileNav({
      currentLocale: () => "zh-CN",
      hydratePhosphorIcons: () => {},
    });
    const trigger = document.getElementById("navMenuBtn") as HTMLButtonElement;
    const closeButton = document.querySelector("[data-mobile-nav-close]") as HTMLButtonElement;

    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-label")).toBe("关闭菜单");
    expect(closeButton.getAttribute("aria-label")).toBe("关闭菜单");

    nav.closeMobileNav();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-label")).toBe("打开导航");
    expect(closeButton.title).toBe("关闭菜单");
  });

  it("uses Simple Icons for npm and GitHub package links", async () => {
    const html = await Bun.file("site/index.html").text();
    const icons = await Bun.file("site/app/icons.js").text();

    const npmIndex = html.indexOf('href="https://www.npmjs.com/package/slexkit"');
    const githubIndex = html.indexOf('href="https://github.com/slexkit/slexkit"');
    expect(npmIndex).toBeGreaterThan(-1);
    expect(githubIndex).toBeGreaterThan(npmIndex);
    expect(html).toContain('aria-label="npm"');
    expect(html).toContain('aria-label="GitHub"');
    expect(html).toContain("M1.763 0C.786 0 0 .786 0 1.763");
    expect(html).toContain("M12 .297c-6.63 0-12 5.373-12 12");
    expect(html).not.toContain('data-phosphor-icon="github-logo"');
    expect(icons).not.toContain("github-logo");
  });

  it("keeps the global desktop navigation centered without overlapping actions", async () => {
    const html = await Bun.file("site/index.html").text();
    const css = (await Bun.file("site/styles/docs-shell.css").text()).replace(/\r\n/g, "\n");

    expect(html).toContain("slex-site-nav");
    expect(html).toContain("slex-site-nav-brand");
    expect(html).toContain("slex-site-nav-actions");
    expect(css).toContain(".slex-site-nav {\n  position: relative;");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);");
    expect(css).toContain(".slex-site-nav-links {\n    display: flex;\n    justify-self: center;");
    expect(css).toContain(".slex-site-nav-actions {\n    justify-self: end;");
    expect(css).toContain(".slex-docs-mobile-toolbar {\n  display: flex;\n  position: fixed;\n  top: 1.375rem;\n  right: 7rem;");
    expect(css).not.toContain("transform: translate(-50%, -50%);");
  });
});
