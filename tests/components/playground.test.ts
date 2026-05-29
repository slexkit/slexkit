import { describe, expect, it, mock } from "bun:test";
import { boot, mount } from "../../src/engine/index";
import { renderToolCall, registerToolTemplate } from "../../src/toolhost/index";
import type { ToolTemplateCompiler } from "../../src/toolhost/index";
import { homePlaygroundSource } from "../../site/playground/home-playground.js";
import "../../src/components/index";
import "../../src/components/tooling";

function sleep(ms = 40) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("playground component", () => {

    it("renders reusable playground components with code, preview, jump, and copy controls", async () => {

      document.body.innerHTML = '<div id="app"></div>';



      const cleanup = mount(

        {

          namespace: "playground_component_test",

          g: {},

          layout: {

            "playground:demo": {

              title: "Metric Playground",

              source: {

                namespace: "playground_component_inner",

                g: {},

                layout: {

                  "text:msg": { text: "Original" },

                },

              },

              previewMinHeight: "120px",

              previewMaxWidth: "320px",

            },

          },

        },

        document.getElementById("app")!,

      );



      await sleep();



      expect(document.querySelector(".slex-playground-title")?.textContent).toBe("Metric Playground");

      expect(document.querySelector(".slex-playground-frame")).toBeNull();

      expect(document.querySelector(".slex-playground")).toBeTruthy();

      expect((document.querySelector(".slex-playground") as HTMLElement)?.style.minHeight).toBe("");

      expect((document.querySelector(".slex-playground") as HTMLElement)?.style.getPropertyValue("--slex-playground-min-height")).toBe("120px");

      expect(document.querySelector(".slex-playground")?.getAttribute("data-mode")).toBe("render");

      expect(document.querySelector(".slex-playground")?.getAttribute("data-preview-align")).toBe("center");

      expect((document.querySelector(".slex-playground-source-picker .slex-select-native") as HTMLSelectElement)?.value).toBe("slex");

      expect(document.querySelector(".slex-playground-preview-pane")?.textContent).toContain("Original");

      for (const mode of ["code", "live", "render"]) {
        const trigger = document.querySelector(`.slex-playground-tabs .slex-tabs-trigger[data-value="${mode}"]`);
        expect(trigger).toBeTruthy();
        expect(trigger?.textContent?.trim()).toBeTruthy();
        expect(trigger?.querySelector("svg")).toBeTruthy();
      }

      expect(document.querySelector('.slex-playground-actions .slex-button[aria-label="Open in playground"] svg')).toBeTruthy();

      expect(document.querySelector('.slex-playground-actions .slex-button[aria-label="Copy source"] svg')).toBeTruthy();
      expect(document.querySelector('.slex-playground-actions .slex-button[aria-label="Toggle theme"]')).toBeNull();

      (document.querySelector('.slex-playground-tabs .slex-tabs-trigger[data-value="code"]') as HTMLButtonElement).click();

      await sleep();

      expect(document.querySelector(".slex-playground")?.getAttribute("data-mode")).toBe("code");

      expect(document.querySelector(".cm-editor")).toBeTruthy();

      expect((document.querySelector(".slex-playground-source-picker .slex-select-native") as HTMLSelectElement)?.value).toBe("slex");

      (document.querySelector('.slex-playground-tabs .slex-tabs-trigger[data-value="live"]') as HTMLButtonElement).click();

      await sleep();

      expect(document.querySelector(".slex-playground")?.getAttribute("data-mode")).toBe("live");

      expect((document.querySelector(".slex-playground-source-picker .slex-select-native") as HTMLSelectElement)?.value).toBe("slex");

      expect(document.querySelector(".slex-playground-live-preview")?.textContent).toContain("Original");

      (document.querySelector('.slex-playground-tabs .slex-tabs-trigger[data-value="render"]') as HTMLButtonElement).click();

      await sleep();

      expect(document.querySelector(".slex-playground")?.getAttribute("data-mode")).toBe("render");

      expect((document.querySelector(".slex-playground-source-picker .slex-select-native") as HTMLSelectElement)?.value).toBe("slex");

      cleanup();

    });

    it("can show a standalone theme toggle before the open and copy actions", async () => {
      document.documentElement.className = "light";
      document.documentElement.dataset.theme = "light";
      window.localStorage.clear();
      document.body.innerHTML = '<div id="app"></div>';

      const cleanup = mount(
        {
          namespace: "playground_theme_toggle_test",
          g: {},
          layout: {
            "playground:demo": {
              source: {
                namespace: "playground_theme_toggle_inner",
                g: {},
                layout: { "text:msg": { text: "Theme" } },
              },
              previewMinHeight: "120px",
              themeLabel: "切换主题",
              themeToggle: true,
            },
          },
        },
        document.getElementById("app")!,
      );

      await sleep();

      const buttons = Array.from(document.querySelectorAll(".slex-playground-actions .slex-button"));
      expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
        "切换主题",
        "Open in playground",
        "Copy source",
      ]);

      const themeButton = buttons[0] as HTMLButtonElement;
      expect(themeButton.getAttribute("aria-pressed")).toBe("false");
      const lightIcon = themeButton.querySelector("svg")?.innerHTML;
      expect(lightIcon).toBeTruthy();
      themeButton.click();
      await sleep();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(window.localStorage.getItem("slexkit:theme")).toBe("dark");
      expect(themeButton.getAttribute("aria-pressed")).toBe("true");
      expect(themeButton.querySelector("svg")?.innerHTML).not.toBe(lightIcon);

      cleanup();
      document.documentElement.className = "light";
      document.documentElement.dataset.theme = "light";
      window.localStorage.clear();
    });




    it("renders multiple direct SlexKit documents and can switch source type", async () => {

      document.body.innerHTML = '<div id="app"></div>';



      const cleanup = mount(

        {

          namespace: "playground_multi_doc_test",

          g: {},

          layout: {

            "playground:demo": {

              mode: "render",

              previewAlign: "start",

              sourceType: "slex",

              previewMinHeight: "120px",

              source: `{

                namespace: "playground_multi_doc",

                layout: { "text:first": { text: "First" } }

              },

              {

                namespace: "playground_multi_doc",

                layout: { "text:second": { text: "Second" } }

              }`,

            },

          },

        },

        document.getElementById("app")!,

      );



      await sleep();

      expect(document.querySelector(".slex-playground")?.getAttribute("data-preview-align")).toBe("start");

      expect(document.querySelectorAll(".slex-playground-document")).toHaveLength(2);

      expect(document.querySelector(".slex-playground-preview-pane")?.textContent).toContain("First");

      expect(document.querySelector(".slex-playground-preview-pane")?.textContent).toContain("Second");



      (document.querySelector('.slex-playground-tabs .slex-tabs-trigger[data-value="code"]') as HTMLButtonElement).click();

      await sleep();

      const trigger = document.querySelector(".slex-playground-source-picker .slex-select-trigger") as HTMLButtonElement;

      trigger.click();

      await sleep();

      const markdownOption = Array.from(document.querySelectorAll(".slex-playground-source-picker .slex-select-option"))

        .find((option) => option.textContent?.includes("Markdown")) as HTMLElement;

      expect(markdownOption).toBeTruthy();

      markdownOption.click();

      await sleep();

      expect((document.querySelector(".slex-playground-source-picker .slex-select-native") as HTMLSelectElement)?.value).toBe("markdown");

      expect(document.querySelector(".slex-playground")?.getAttribute("data-source-type")).toBe("markdown");

      (document.querySelector('.slex-playground-tabs .slex-tabs-trigger[data-value="render"]') as HTMLButtonElement).click();

      await sleep();

      expect(document.querySelectorAll(".slex-playground-document")).toHaveLength(0);

      expect(document.querySelector(".slex-playground-preview-pane")?.textContent).toContain("namespace");



      cleanup();

    });




    it("renders standalone markdown playground fences from the home RC filter demo", async () => {

      document.body.innerHTML = '<div id="app"></div>';



      const source = homePlaygroundSource("zh-CN");

      const cleanup = mount(

        {

          namespace: "playground_markdown_home_demo",

          g: {},

          layout: {

            "playground:demo": {

              mode: "render",

              sourceType: "markdown",

              previewMinHeight: "320px",

              source,

            },

          },

        },

        document.getElementById("app")!,

      );



      await sleep();

      expect(document.querySelector(".slex-standalone-playground-error")).toBeNull();
      expect(document.querySelector(".slex-playground")?.getAttribute("data-source-type")).toBe("markdown");
      expect(document.querySelector(".slex-playground")?.getAttribute("data-preview-align")).toBe("start");
      expect(document.querySelector(".slex-streamdown-error")).toBeNull();
      expect(document.querySelector(".slex-render-error")).toBeNull();

      expect(document.querySelector(".slex-playground-preview-pane")?.textContent).toContain("一阶 RC 低通滤波器");

      expect(document.querySelectorAll(".slex-input")).toHaveLength(4);
      expect(document.querySelectorAll(".slex-slider")).toHaveLength(4);

      expect(Array.from(document.querySelectorAll(".slex-stat")).map((node) => node.textContent?.trim())).toEqual([

        "时间常数 1.000 ms",

        "截止频率 159.15 Hz",

        "幅值增益 0.157",

        "输出幅值 0.157 V",

      ]);



      cleanup();

    });




    it("clears the live splitter dragging state after pointer release", async () => {

      document.body.innerHTML = '<div id="app"></div>';

      const cleanup = mount(

        {

          namespace: "playground_splitter_drag_test",

          g: {},

          layout: {

            "playground:demo": {

              mode: "live",

              source: {

                namespace: "playground_splitter_inner",

                layout: {

                  "text:msg": { text: "Drag test" },

                },

              },

            },

          },

        },

        document.getElementById("app")!,

      );

      await sleep();

      const splitter = document.querySelector(".slex-playground-splitter") as HTMLElement;
      expect(splitter).toBeTruthy();

      splitter.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 320, clientY: 120 }));
      await sleep();
      expect(splitter.classList.contains("dragging")).toBe(true);

      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 320, clientY: 120 }));
      await sleep();
      expect(splitter.classList.contains("dragging")).toBe(false);

      splitter.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 320, clientY: 120 }));
      await sleep();
      expect(splitter.classList.contains("dragging")).toBe(true);

      window.dispatchEvent(new Event("blur"));
      await sleep();
      expect(splitter.classList.contains("dragging")).toBe(false);

      cleanup();

    });




    it("keeps playground splitters and editor scrollbars neutral after pointer interaction", async () => {

      const css = await Bun.file("src/styles/tooling.css").text();

      expect(css).toContain(".slex-playground-splitter:focus-visible");
      expect(css).toContain(".slex-standalone-playground-splitter:focus-visible");
      expect(css).toContain(".slex-playground-splitter.dragging");
      expect(css).toContain(".slex-standalone-playground-splitter.dragging");
      expect(css).not.toContain(".slex-playground-splitter:hover");
      expect(css).not.toContain(".slex-standalone-playground-splitter:hover");
      expect(css).toContain(".slex-playground-editor .cm-scroller::-webkit-scrollbar-thumb:active");
      expect(css).toContain(".slex-standalone-playground-editor .cm-scroller::-webkit-scrollbar-thumb:active");
      expect(css).toContain("scrollbar-color: color-mix(in oklab, var(--muted-foreground) 42%, transparent) transparent");
      expect(css).toContain("--slex-code-keyword");
      expect(css).toContain(".dark .slex-playground-editor");
      expect(css).toContain(".dark .slex-standalone-playground-editor");
      expect(css).toContain('[class~="ͼb"]');
      expect(css).toContain('[class~="ͼe"]');
      expect(css).toContain("var(--slex-code-string)");

    });
});
