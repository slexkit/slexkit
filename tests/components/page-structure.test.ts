import { describe, expect, it, mock } from "bun:test";
import { mount, register } from "../../src/engine/index";
import { attachComponentDisposer } from "../../src/engine/component-scope";
import { registerAll } from "../../src/components/index";
import "../../src/components/tooling";
import { registerSiteComponents } from "../../site/app/site-components";

registerAll();
registerSiteComponents({ register, attachComponentDisposer });

function unique(ns = "page_structure") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function sleep(ms = 20) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("page structure components", () => {
  it("renders page and hero as higher-level page building blocks", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique(),
        g: {},
        layout: {
          "page:home": {
            maxWidth: "960px",
            density: "compact",
            "hero:intro": {
              eyebrow: "beta",
              title: "SlexKit",
              subtitle: "Compose interactive UI with compact Slex.",
              primaryLabel: "Components",
              primaryHref: "/components",
              secondaryLabel: "Design spec",
              secondaryHref: "/design",
              "card:preview": {
                title: "Live preview",
                "stat:state": {
                  label: "State",
                  value: "ready",
                },
              },
            },
          },
        },
      },
      document.getElementById("app")!,
    );

    const page = document.querySelector(".slex-page") as HTMLElement;
    expect(page).toBeTruthy();
    expect(page.getAttribute("data-density")).toBe("compact");
    expect(page.style.maxWidth).toBe("960px");
    expect(document.querySelector(".slex-hero-title")?.textContent).toBe("SlexKit");
    expect(document.querySelector(".slex-hero-action--primary")?.getAttribute("href")).toBe("/components");
    expect(document.querySelector(".slex-hero-media .slex-card")).toBeTruthy();
  });

  it("renders toc items with active state and click payload", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const events: unknown[] = [];

    mount(
      {
        namespace: unique("toc"),
        g: {
          events,
          record(event: unknown) {
            this.events.push(event);
          },
        },
        layout: {
          "toc:design": {
            label: "Outline",
            orientation: "horizontal",
            active: "#color-system",
            items: [
              { href: "#aesthetic-principles", label: "Principles" },
              { href: "#color-system", label: "Colors" },
            ],
            onclick: "g.record($event)",
          },
        },
      },
      document.getElementById("app")!,
    );

    const toc = document.querySelector(".slex-toc") as HTMLElement;
    expect(toc.getAttribute("data-orientation")).toBe("horizontal");
    const links = document.querySelectorAll(".slex-toc-link");
    expect(links).toHaveLength(2);
    expect(links[1].classList.contains("slex-toc-link--active")).toBe(true);
    (links[0] as HTMLAnchorElement).click();
    expect(events).toHaveLength(1);
  });

  it("renders grouped catalogs and emits selected component metadata", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const events: unknown[] = [];

    mount(
      {
        namespace: unique("catalog"),
        g: {
          events,
          record(event: unknown) {
            this.events.push(event);
          },
        },
        layout: {
          "catalog:components": {
            label: "Components",
            countLabel: "4 components",
            active: "button",
            preventDefault: true,
            items: [
              { id: "paragraph", title: "Paragraph", category: "Content", href: "/components/paragraph" },
              { id: "heading", title: "Heading", category: "Content", href: "/components/heading", status: "ready" },
              { id: "button", title: "Button", category: "Input", href: "/components/button", status: "ready" },
              { id: "progress", title: "Progress", category: "Feedback", href: "/components/progress", status: "ready" },
            ],
            onselect: "g.record($event)",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-catalog-label")?.textContent).toBe("Components");
    expect(document.querySelector(".slex-catalog-count")?.textContent).toBe("4 components");
    expect(document.querySelectorAll(".slex-catalog-group")).toHaveLength(3);
    expect(document.querySelector(".slex-catalog-group")?.textContent).toContain("2");
    expect(document.querySelectorAll(".slex-catalog-item")).toHaveLength(4);
    const active = document.querySelector(".slex-catalog-item--active") as HTMLAnchorElement;
    expect(active.textContent).toContain("Button");
    active.click();
    expect(events).toHaveLength(1);
    expect((events[0] as { id: string }).id).toBe("button");
  });

  it("renders standalone doc prose from html", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("doc_prose"),
        g: { html: "<h2>Spec</h2><p>Use shared tokens.</p>" },
        layout: {
          "doc-prose:body": {
            $html: "g.html",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-doc-prose h2")?.textContent).toBe("Spec");
    expect(document.querySelector(".slex-doc-prose p")?.textContent).toBe("Use shared tokens.");
  });

  it("renders docs shell as independently collapsible sections", async () => {
    const writeText = mock().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    document.body.innerHTML = '<div id="app"></div>';
    const events: unknown[] = [];

    mount(
      {
        namespace: unique("component_browser"),
        g: {
          events,
          docs: [
            { id: "guides/intro", title: "Intro", group: "Guides", category: "Getting Started", href: "/docs/guides/intro" },
            { id: "components/button", title: "Button", group: "Components", category: "Input", href: "/docs/components/button" },
            { id: "components/accordion", title: "Accordion", group: "Components", category: "Disclosure", href: "/docs/components/accordion" },
          ],
          doc: {
            title: "Button",
            summary: "Trigger action.",
            href: "/docs/components/button",
            markdownHref: "/docs/components/button.md",
            bodyHtml: "<h2>Usage</h2><p>Click to emit.</p>",
            markdown: "## Usage\n\nClick to emit.",
            toc: [
              { id: "button-usage", title: "1. Usage", depth: 2 },
              { id: "button-basic", title: "Basic", depth: 3 },
            ],
          },
          playground: {
            title: "Button",
            source: {
              namespace: "doc_button_inline",
              g: { count: 0 },
              layout: {
                "button:add": { label: "Add" },
              },
            },
            previewMinHeight: "120px",
          },
          record(event: unknown) {
            this.events.push(event);
          },
        },
        layout: {
          "docs-shell:site": {
            label: "Docs",
            countLabel: "2 components",
            active: "/docs/components/button",
            preventDefault: true,
            $items: "g.docs",
            $doc: "g.doc",
            $playground: "g.playground",
            onselect: "g.record($event)",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-docs-shell")).toBeTruthy();
    expect(document.querySelectorAll(".slex-docs-flowbite-sidebar")).toHaveLength(1);
    expect(document.querySelector(".slex-docs-sidebar-trigger")?.getAttribute("aria-label")).toBe("打开文档导航");
    expect(Array.from(document.querySelectorAll(".slex-docs-section-trigger")).map((node) => node.textContent?.trim())).toEqual([
      "Guides",
      "Components",
    ]);
    expect(document.querySelector('[aria-controls="docs-section-guides-panel"]')?.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector('[aria-controls="docs-section-components-panel"]')?.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("docs-section-guides-panel")?.getAttribute("aria-hidden")).toBe("false");
    expect(document.getElementById("docs-section-guides-panel")?.classList.contains("slex-docs-section-panel--open")).toBe(true);
    expect(document.querySelectorAll(".slex-docs-subgroup-title")).toHaveLength(0);
    expect(Array.from(document.querySelectorAll(".slex-docs-section-panel--open a")).map((node) => node.textContent?.trim())).toEqual([
      "Intro",
      "Accordion",
      "Button",
    ]);
    expect(document.querySelector(".slex-playground-title")?.textContent).toBe("Button");
    expect(document.querySelector(".slex-doc-detail-title")).toBeNull();
    expect(document.querySelector(".slex-doc-detail-summary")).toBeNull();
    expect(document.querySelector(".slex-doc-prose h2")?.textContent).toBe("Usage");
    expect(document.querySelector(".slex-doc-detail-rail-title")?.textContent).toBe("本页");
    expect(Array.from(document.querySelectorAll(".slex-doc-detail-toc-link")).map((node) => node.textContent)).toEqual(["Usage"]);
    expect(Array.from(document.querySelectorAll(".slex-doc-detail-actions--content .slex-doc-detail-action")).map((node) => node.textContent)).toEqual([
      "复制页面",
      "Markdown",
      "以 Live 模式打开",
    ]);
    expect(Array.from(document.querySelectorAll(".slex-doc-detail-actions--rail .slex-doc-detail-action")).map((node) => node.textContent)).toEqual([
      "复制页面",
      "Markdown",
      "以 Live 模式打开",
    ]);
    expect(document.querySelectorAll(".slex-doc-detail-actions--rail .slex-doc-detail-action svg")).toHaveLength(3);
    expect((document.querySelector(".slex-doc-detail-action[href]") as HTMLAnchorElement).pathname).toBe("/docs/components/button.md");
    (document.querySelector(".slex-doc-detail-action") as HTMLButtonElement).click();
    await sleep();
    expect(writeText).toHaveBeenCalledWith("## Usage\n\nClick to emit.");
    expect(document.querySelector(".slex-doc-detail-copy-feedback")?.textContent).toBe("已复制页面");

    (Array.from(document.querySelectorAll(".slex-docs-flowbite-sidebar a")).find((node) => node.textContent?.includes("Button")) as HTMLAnchorElement).click();
    expect(events).toHaveLength(1);

    (document.querySelector('[aria-controls="docs-section-guides-panel"]') as HTMLButtonElement).click();
    await sleep();
    expect(document.getElementById("docs-section-guides-panel")?.getAttribute("aria-hidden")).toBe("true");
    expect(document.getElementById("docs-section-components-panel")?.getAttribute("aria-hidden")).toBe("false");
    expect(document.getElementById("docs-section-components-panel")?.classList.contains("slex-docs-section-panel--open")).toBe(true);
    expect(Array.from(document.querySelectorAll(".slex-docs-section-panel--open a")).map((node) => node.textContent?.trim())).toEqual([
      "Accordion",
      "Button",
    ]);

    (document.querySelector('[aria-controls="docs-section-components-panel"]') as HTMLButtonElement).click();
    await sleep();
    expect(document.getElementById("docs-section-guides-panel")?.getAttribute("aria-hidden")).toBe("true");
    expect(document.getElementById("docs-section-components-panel")?.getAttribute("aria-hidden")).toBe("true");
    expect(Array.from(document.querySelectorAll(".slex-docs-section-panel--open a")).map((node) => node.textContent?.trim())).toEqual([]);
  });
});
