import { afterEach, describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import {
  REQUIRED_HOST_THEME_TOKENS,
  observeHostThemePalette,
  observeThemeMode,
  resolveThemeMode,
} from "../../src/engine/theme";

const originalGetComputedStyle = window.getComputedStyle;

function mockThemeTokens(tokens: Iterable<string>): void {
  const available = new Set(tokens);
  window.getComputedStyle = (() => ({
    getPropertyValue(token: string) {
      return available.has(token) ? ` value-for-${token} ` : "";
    },
  })) as unknown as typeof window.getComputedStyle;
}

afterEach(() => {
  window.getComputedStyle = originalGetComputedStyle;
  document.body.replaceChildren();
});

describe("theme contract", () => {
  it("uses a coherent palette for unpaired colors and releases its observer", async () => {
    // The shared test setup intentionally mocks MutationObserver. Use a fresh
    // document here to exercise real delivery and disconnection.
    const dom=new JSDOM("<!doctype html><html><body></body></html>");
    const doc=dom.window.document;
    const container=doc.createElement("div"), root=doc.createElement("div");
    doc.body.append(container);container.append(root);
    container.style.setProperty("--primary", "#7722aa");
    const dispose=observeHostThemePalette(root,container);
    expect(root.hasAttribute("data-slex-incomplete-palette")).toBe(true);
    container.style.setProperty("--primary-foreground", "white");
    await Promise.resolve();
    expect(root.hasAttribute("data-slex-incomplete-palette")).toBe(false);
    dom.window.close();
    dispose();container.style.removeProperty("--primary-foreground");
    await Promise.resolve();
    expect(root.hasAttribute("data-slex-incomplete-palette")).toBe(false);
  });
  it("keeps auto on uno when no host semantic tokens are present", () => {
    mockThemeTokens([]);
    expect(resolveThemeMode(document.createElement("div"), "auto")).toBe("uno");
  });

  it("does not select a partial host semantic palette", () => {
    mockThemeTokens(REQUIRED_HOST_THEME_TOKENS.slice(0, -1));
    expect(resolveThemeMode(document.createElement("div"), "auto")).toBe("uno");
  });

  it("selects host-shadcn only for the complete required semantic palette", () => {
    mockThemeTokens(REQUIRED_HOST_THEME_TOKENS);
    expect(resolveThemeMode(document.createElement("div"), "auto")).toBe("host-shadcn");
  });

  it("honors explicit modes even when the host palette is absent or partial", () => {
    mockThemeTokens(["--primary"]);
    const container = document.createElement("div");

    expect(resolveThemeMode(container, "host-shadcn")).toBe("host-shadcn");
    expect(resolveThemeMode(container, "uno")).toBe("uno");
    expect(resolveThemeMode(container, "flowbite")).toBe("flowbite");
  });

  it("keeps an existing SlexKit theme boundary on the uno path", () => {
    mockThemeTokens(REQUIRED_HOST_THEME_TOKENS);
    const boundary = document.createElement("div");
    boundary.className = "slexkit-theme-uno";
    const container = document.createElement("div");
    boundary.appendChild(container);
    document.body.appendChild(boundary);

    expect(resolveThemeMode(container, "auto")).toBe("uno");
  });

  it("inherits the nearest Slex custom element theme instead of redetecting slotted tokens", () => {
    mockThemeTokens(REQUIRED_HOST_THEME_TOKENS);
    const parent = document.createElement("slex-card");
    const shadow = parent.attachShadow({ mode: "open" });
    const root = document.createElement("div");
    root.className = "slexkit-root slexkit-theme-uno";
    shadow.append(root);
    const wrapper = document.createElement("div");
    const child = document.createElement("slex-stat");
    wrapper.append(child);
    parent.append(wrapper);
    document.body.append(parent);

    expect(resolveThemeMode(child, "auto")).toBe("uno");
  });

  it("updates a shadow mount between missing, complete, and partial host palettes", async () => {
    window.getComputedStyle = originalGetComputedStyle;
    const container = document.createElement("div");
    const root = document.createElement("div");
    container.append(root);
    document.body.append(container);
    const dispose = observeThemeMode(root, container);
    expect(root.classList.contains("slexkit-theme-uno")).toBe(true);

    for (const token of REQUIRED_HOST_THEME_TOKENS)
      container.style.setProperty(token, `value-${token}`);
    document.dispatchEvent(new Event("load"));
    expect(root.classList.contains("slexkit-theme-host-shadcn")).toBe(true);
    expect(root.hasAttribute("data-slex-incomplete-palette")).toBe(false);

    container.style.removeProperty("--ring");
    document.dispatchEvent(new Event("load"));
    expect(root.classList.contains("slexkit-theme-uno")).toBe(true);
    expect(root.classList.contains("slexkit-theme-host-shadcn")).toBe(false);
    dispose();
  });

  it("uses private fallback aliases without declaring host semantic variables", async () => {
    const css = await readFile(
      new URL("../../src/styles/theme.css", import.meta.url),
      "utf8",
    );

    for (const token of REQUIRED_HOST_THEME_TOKENS) {
      expect(css).toContain(`--slex-${token.slice(2)}: var(${token},`);
    }
    expect(css).not.toMatch(
      /^\s+--(?:background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|border|input|ring):/m,
    );
    expect(css).not.toContain("#4A90E2");
    expect(css).toContain("--slex-radius: var(--radius, 0.5rem)");
    expect(css).toContain("--slex-shadow-sm: var(--shadow-sm,");
    expect(css).toContain("--slex-font-sans: var(");
  });
});
