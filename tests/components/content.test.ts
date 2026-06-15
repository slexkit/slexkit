import { describe, expect, it } from "bun:test";
import { mount, register } from "../../src/engine/index";
import { attachComponentDisposer } from "../../src/engine/component-scope";
import { registerAll } from "../../src/components/index";
import { registerSiteComponents } from "../../site/app/site-components";

registerAll();
registerSiteComponents({ register, attachComponentDisposer });

function unique(ns = "content") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("content components", () => {
  it("renders runtime content primitives for embedded tools", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique(),
        g: {
          title: "Design Spec",
          rows: [
            { name: "Heading", use: "Section title" },
            { name: "Callout", use: "Important note" },
          ],
        },
        layout: {
          "text:title": {
            $text: "g.title",
          },
          "badge:status": {
            tone: "success",
            label: "Ready",
          },
          "code-block:sample": {
            title: "Example",
            language: "json",
            code: '{ "text:title": { "text": "SlexKit" } }',
          },
          "table:components": {
            columns: [
              { key: "name", label: "Name" },
              { key: "use", label: "Use" },
            ],
            $rows: "g.rows",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-text")?.textContent).toBe("Design Spec");
    expect(document.querySelector(".slex-badge")?.getAttribute("data-tone")).toBe("success");
    expect(document.querySelector(".slex-code-block code")?.textContent).toContain("text:title");
    expect(document.querySelector(".slex-code-block > pre")?.classList.contains("slex-code-block-pre")).toBe(true);
    expect(document.querySelectorAll(".slex-table tbody tr")).toHaveLength(2);
  });

  it("renders array rows when columns are provided", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("table_arrays"),
        layout: {
          "table:evidence": {
            columns: ["来源", "命中点", "用途"],
            rows: [
              ["security.md", "sandbox iframe", "运行边界"],
              ["integration.md", "runtime host", "宿主接入"],
            ],
          },
        },
      },
      document.getElementById("app")!,
    );

    const table = document.querySelector(".slex-table") as HTMLElement;
    expect(table.textContent).toContain("security.md");
    expect(table.textContent).toContain("runtime host");
    expect(table.querySelectorAll("tbody td")).toHaveLength(6);
  });

  it("renders SlexKit state through KaTeX formulas", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = unique("formula");

    mount(
      {
        namespace,
        g: { energy: 42 },
        layout: {
          "formula:energy": {
            $tex: "'E = ' + g.energy + '\\\\text{ J}'",
          },
        },
      },
      document.getElementById("app")!,
    );

    const formula = document.querySelector(".slex-formula") as HTMLElement;
    expect(formula.querySelector(".katex")).toBeTruthy();
    expect(formula.textContent?.replace(/\s+/g, "")).toContain("E=42J");

    mount(
      {
        namespace,
        g: { energy: 84 },
        layout: {
          "formula:energy": {
            $tex: "'E = ' + g.energy + '\\\\text{ J}'",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-formula")?.textContent?.replace(/\s+/g, "")).toContain("E=84J");
  });

  it("highlights code block content for supported languages", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("code_highlight"),
        layout: {
          "code-block:sample": {
            title: "Config",
            language: "js",
            code: "export const enabled = true;",
          },
        },
      },
      document.getElementById("app")!,
    );

    const code = document.querySelector(".slex-code-block code") as HTMLElement;
    expect(code.classList.contains("slex-code-highlight")).toBe(true);
    expect(code.classList.contains("slex-code-lines")).toBe(true);
    expect(code.getAttribute("data-line-numbers")).toBe("true");
    expect(code.classList.contains("language-javascript")).toBe(true);
    expect(code.textContent).toBe("export const enabled = true;");
    expect(code.querySelector(".slex-code-token--keyword")?.textContent).toBe("export");
    expect(code.querySelector(".slex-code-token--literal")?.textContent).toBe("true");
    expect(code.querySelectorAll(".slex-code-line")).toHaveLength(1);
    expect(code.querySelector(".slex-code-line-content")?.textContent).toBe("export const enabled = true;");
  });

  it("keeps code block pre styling isolated from prose code styles", async () => {
    const css = await Bun.file("src/styles/content.css").text();
    const codeBlockPreCss = css.slice(css.indexOf(".slex-code-block .slex-code-block-pre {"), css.indexOf(".slex-code-block code {"));

    expect(codeBlockPreCss).toContain("margin: 0;");
    expect(codeBlockPreCss).toContain("border: 0;");
    expect(codeBlockPreCss).toContain("background: transparent;");
    expect(codeBlockPreCss).toContain("box-shadow: none;");
    expect(css).toContain(".slex-code-block .slex-code-token--keyword");
    expect(css).toContain("counter-reset: slex-code-line;");
    expect(css).toContain("content: counter(slex-code-line);");
  });

  it("normalizes badge tone aliases to semantic tokens", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("badge_tones"),
        layout: {
          "row:badges": {
            "badge:danger": {
              tone: "danger",
              label: "Danger",
            },
            "badge:error": {
              type: "error",
              label: "Error",
            },
            "badge:muted": {
              tone: "muted",
              label: "Muted",
            },
          },
        },
      },
      document.getElementById("app")!,
    );

    const badges = document.querySelectorAll(".slex-badge");
    expect(badges[0].getAttribute("data-tone")).toBe("destructive");
    expect(badges[1].getAttribute("data-tone")).toBe("destructive");
    expect(badges[2].getAttribute("data-tone")).toBe("neutral");

    const css = await Bun.file("src/styles/content.css").text();
    const badgeCss = css.slice(css.indexOf(".slex-badge {"), css.indexOf(".slex-divider {"));
    expect(badgeCss).toContain('.slex-badge[data-tone="neutral"]');
    expect(badgeCss).toContain('.slex-badge[data-tone="danger"]');
    expect(badgeCss).toContain('.slex-badge[data-tone="destructive"]');
    expect(badgeCss).toContain("color-mix(in oklab, var(--success)");
    expect(badgeCss).toContain("color-mix(in oklab, var(--warning)");
    expect(badgeCss).not.toContain("background: var(--success);");
    expect(badgeCss).not.toContain("background: var(--warning);");
    expect(badgeCss).not.toContain("background: var(--info);");
  });

  it("keeps section and callout composition inside components", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("section"),
        g: {},
        layout: {
          "section:typography": {
            title: "Typography and Icons",
            subtitle: "Typography and icons support scanning efficiency.",
            "callout:principle": {
              tone: "info",
              title: "Principle",
              "text:body": {
                text: "Restrained titles, clear body text, unified action symbols.",
              },
            },
          },
        },
      },
      document.getElementById("app")!,
    );

    const section = document.querySelector(".slex-section") as HTMLElement;
    expect(section.id).toBe("typography");
    expect(section.querySelector(".slex-section-title")?.textContent).toBe("Typography and Icons");
    expect(section.querySelector(".slex-callout")?.getAttribute("data-tone")).toBe("info");
    expect(section.querySelector(".slex-text")?.textContent).toBe("Restrained titles, clear body text, unified action symbols.");
  });

  it("renders callout with toast-like Flowbite structure without dismissal chrome", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("callout_flowbite"),
        layout: {
          "callout:notice": {
            tone: "success",
            title: "Saved",
            text: "Changes have been written.",
          },
        },
      },
      document.getElementById("app")!,
    );

    const callout = document.querySelector(".slex-callout") as HTMLElement;
    expect(callout.getAttribute("data-scope")).toBe("callout");
    expect(callout.getAttribute("data-tone")).toBe("success");
    expect(callout.getAttribute("role")).toBe("note");
    expect(callout.querySelector(".slex-callout-mark")).toBeTruthy();
    expect(callout.querySelector(".slex-callout-title")?.textContent).toBe("Saved");
    expect(callout.querySelector(".slex-callout-body")?.textContent).toBe("Changes have been written.");
    expect(callout.querySelector(".slex-toast-close")).toBeNull();

    const css = await Bun.file("src/styles/content.css").text();
    const calloutCss = css.slice(css.indexOf(".slex-callout {"), css.indexOf(".slex-code-block {"));
    expect(calloutCss).toContain("background: transparent;");
    expect(calloutCss).toContain("box-sizing: border-box;");
    expect(calloutCss).toContain("width: 100%;");
    expect(calloutCss).toContain("max-width: none;");
    expect(calloutCss).not.toContain("color-mix(in oklab, var(--success)");
  });

  it("renders heading metadata below the title", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("heading"),
        layout: {
          "heading:philosophy": {
            level: 4,
            title: "任务优先",
            meta: "TASK-FIRST",
            subtitle: "每一步设计都服务于核心任务。",
          },
        },
      },
      document.getElementById("app")!,
    );

    const heading = document.querySelector(".slex-heading") as HTMLElement;
    expect(heading.getAttribute("data-level")).toBe("4");
    expect(heading.querySelector(".slex-heading-title")?.textContent).toBe("任务优先");
    expect(heading.querySelector(".slex-heading-meta")?.textContent).toBe("TASK-FIRST");
    expect(heading.querySelector(".slex-heading-subtitle")?.textContent).toBe("每一步设计都服务于核心任务。");
  });

  it("renders semantic swatch and diagram primitives", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("visual"),
        layout: {
          "swatch:success": {
            tone: "success",
          },
          "diagram:philosophy": {},
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-swatch")?.getAttribute("data-tone")).toBe("success");
    expect(document.querySelector(".slex-diagram")?.getAttribute("data-kind")).toBe("philosophy");
  });

  it("keeps card styling out of authored class and variant fields", () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount(
      {
        namespace: unique("card"),
        layout: {
          "card:sample": {
            class: "custom-card",
            variant: "semantic",
            title: "Card",
            "text:body": {
              text: "Body",
            },
          },
        },
      },
      document.getElementById("app")!,
    );

    const card = document.querySelector(".slex-card") as HTMLElement;
    expect(card.classList.contains("custom-card")).toBe(false);
    expect(card.classList.contains("slex-card--semantic")).toBe(false);
  });
});
