import { describe, expect, it } from "bun:test";
import { colors } from "@unocss/preset-wind4/colors";
import { fallbackThemeCss } from "../../uno.config";
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
    const css = await Bun.file("site/styles/docs-shell.css").text();

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
