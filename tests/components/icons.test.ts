import { afterEach, describe, expect, it } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";
import {
  clearRegisteredIcons,
  getIcon,
  iconifySvgUrl,
  loadIcon,
  normalizeIconName,
  registerIcon,
  resolveIconifyIcon,
} from "../../src/icons/manager";

const originalFetch = globalThis.fetch;

function sleep(ms = 30) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  clearRegisteredIcons();
  document.body.innerHTML = "";
});

describe("icon manager", () => {
  it("normalizes common icon naming styles", () => {
    expect(normalizeIconName("GearSix")).toBe("gear-six");
    expect(normalizeIconName("ph:ChartBar")).toBe("ph:chart-bar");
    expect(getIcon("GearSix")).toContain("<svg");
  });

  it("allows host apps to register global icons", () => {
    const svg = '<svg viewBox="0 0 16 16"><path d="M1 1h14v14H1z"/></svg>';
    registerIcon("brand:LogoMark", svg, { aliases: ["logo-mark"] });
    expect(getIcon("brand:logo-mark")).toBe(svg);
    expect(getIcon("LogoMark")).toBe(svg);
  });

  it("resolves Iconify fallback urls", () => {
    expect(resolveIconifyIcon("ChartBar")).toEqual({ prefix: "ph", name: "chart-bar" });
    expect(resolveIconifyIcon("phosphor:ChartBar", { selected: true })).toEqual({
      prefix: "ph",
      name: "chart-bar-duotone",
    });
    expect(resolveIconifyIcon("lucide:copy")).toEqual({ prefix: "lucide", name: "copy" });
    expect(iconifySvgUrl("lucide:copy")).toBe(
      "https://api.iconify.design/lucide/copy.svg?width=1em&height=1em",
    );
  });

  it("loads missing icons from Iconify and sanitizes unsafe SVG", async () => {
    const urls: string[] = [];
    globalThis.fetch = async (input) => {
      urls.push(String(input));
      return new Response('<svg viewBox="0 0 16 16"><path d="M1 1h14v14H1z"/></svg>');
    };

    await expect(loadIcon("lucide:copy")).resolves.toContain("<svg");
    expect(urls).toEqual(["https://api.iconify.design/lucide/copy.svg?width=1em&height=1em"]);

    globalThis.fetch = async () => new Response("<svg><script>alert(1)</script></svg>");
    await expect(loadIcon("lucide:unsafe")).resolves.toBe("");
  });

  it("renders async icons in buttons", async () => {
    globalThis.fetch = async () =>
      new Response(
        '<svg viewBox="0 0 16 16" data-testid="remote-icon"><path d="M2 2h12v12H2z"/></svg>',
      );

    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: "button_remote_icon",
        layout: {
          "button:chart": {
            label: "Chart",
            icon: "ChartBar",
          },
        },
      },
      document.getElementById("app")!,
    );

    await sleep(50);
    expect(document.querySelector('.slex-button-icon svg[data-testid="remote-icon"]')).toBeTruthy();
  });

  it("renders registered icons across visible title and label surfaces", async () => {
    registerIcon(
      "test:mark",
      '<svg viewBox="0 0 16 16" data-testid="label-icon"><path d="M2 2h12v12H2z"/></svg>',
      { aliases: ["test-mark"] },
    );

    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: "visible_label_icons",
        layout: {
          "accordion:main": {
            value: "one",
            items: [{ value: "one", label: "One", icon: "test-mark", content: "First" }],
          },
          "badge:state": { label: "Ready", icon: "test-mark" },
          "callout:note": { title: "Notice", icon: "test-mark", text: "Read this." },
          "card:panel": { title: "Panel", icon: "test-mark" },
          "section:overview": { title: "Overview", icon: "test-mark" },
          "toast:done": { title: "Saved", icon: "test-mark", duration: 0 },
          "stat:count": { label: "Requests", value: 42, icon: "test-mark" },
          "slider:volume": { label: "Volume", value: 45, icon: "test-mark" },
          "progress:build": { label: "Build", value: 64, icon: "test-mark" },
          "checkbox:agree": { label: "Agree", checked: true, icon: "test-mark" },
          "switch:sync": { label: "Sync", enabled: true, icon: "test-mark" },
          "radio-group:mode": {
            label: "Mode",
            icon: "test-mark",
            value: "auto",
            options: [{ label: "Auto", value: "auto", icon: "test-mark" }],
          },
          "select:env": {
            label: "Environment",
            icon: "test-mark",
            value: "prod",
            options: [{ label: "Production", value: "prod", icon: "test-mark" }],
          },
          "collapsible:details": { trigger: "Details", icon: "test-mark", content: "More" },
          "link:docs": { label: "Docs", href: "#docs", icon: "test-mark" },
          "divider:phase": { label: "Phase", icon: "test-mark" },
          "code-block:sample": { title: "Example", language: "js", code: "const a = 1;", icon: "test-mark" },
          "table:users": {
            columns: [{ key: "name", label: "Name", icon: "test-mark" }],
            rows: [{ name: "Ada" }],
          },
        },
      },
      document.getElementById("app")!,
    );

    const iconSelectors = [
      ".slex-accordion-icon",
      ".slex-badge-icon",
      ".slex-callout-icon",
      ".slex-card-icon",
      ".slex-section-icon",
      ".slex-toast-icon",
      ".slex-stat-icon",
      ".slex-slider-icon",
      ".slex-progress-icon",
      ".slex-checkbox-icon",
      ".slex-switch-icon",
      ".slex-radio-group-icon",
      ".slex-radio-icon",
      ".slex-select-label-icon",
      ".slex-select-value-icon",
      ".slex-collapsible-icon",
      ".slex-link-icon",
      ".slex-divider-icon",
      ".slex-code-block-icon",
      ".slex-table-column-icon",
    ];

    for (const selector of iconSelectors) {
      expect(document.querySelector(`${selector} svg[data-testid="label-icon"]`), selector).toBeTruthy();
    }

    (document.querySelector(".slex-select-trigger") as HTMLButtonElement).click();
    await sleep();
    expect(document.querySelector('.slex-select-option-icon svg[data-testid="label-icon"]')).toBeTruthy();
  });

  it("loads remote icons for non-button label surfaces", async () => {
    globalThis.fetch = async () =>
      new Response(
        '<svg viewBox="0 0 16 16" data-testid="remote-label-icon"><path d="M2 2h12v12H2z"/></svg>',
      );

    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: "remote_label_icon",
        layout: {
          "callout:remote": {
            title: "Remote",
            icon: "lucide:remote-visible-label",
            text: "Async icon.",
          },
        },
      },
      document.getElementById("app")!,
    );

    await sleep(50);
    expect(document.querySelector('.slex-callout-icon svg[data-testid="remote-label-icon"]')).toBeTruthy();
  });

  it("does not render empty icon nodes when icon fields are omitted", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: "no_empty_icons",
        layout: {
          "badge:plain_badge": { label: "Plain" },
          "button:plain_button": { label: "Plain button" },
          "callout:plain_callout": { title: "Plain callout", text: "No icon." },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-icon")).toBeNull();
    expect(document.querySelector(".slex-badge")?.textContent).toContain("Plain");
    expect(document.querySelector(".slex-button")?.textContent).toContain("Plain button");
    expect(document.querySelector(".slex-callout-title")?.textContent).toContain("Plain callout");
  });
});
