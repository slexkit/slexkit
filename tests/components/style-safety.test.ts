import { describe, expect, it } from "bun:test";

const runtimeCssFiles = [
  "src/styles/layout.css",
  "src/styles/content.css",
  "src/styles/display.css",
  "src/styles/feedback.css",
  "src/styles/tooling.css",
  "src/styles/components/button.css",
  "src/styles/components/choice.css",
  "src/styles/components/select.css",
  "src/styles/components/slider.css",
  "src/styles/components/switch.css",
  "src/styles/components/tabs.css",
  "src/styles/components/text-input.css",
];

describe("runtime style safety", () => {
  it("avoids broad or partially supported selectors in shipped runtime CSS", async () => {
    const css = (await Promise.all(runtimeCssFiles.map((file) => Bun.file(file).text()))).join("\n");

    expect(css).not.toContain(":has(");
    expect(css).not.toContain("clip-path");
  });

  it("keeps range track paint out of the slider input box", async () => {
    const css = await Bun.file("src/styles/components/slider.css").text();

    expect(css).toContain(".slex-slider {\n  box-sizing: border-box;");
    expect(css).toContain("background: transparent;");
    expect(css).toContain(".slex-slider::-webkit-slider-runnable-track");
    expect(css).toContain("var(--primary) var(--slex-slider-progress, 0%)");
  });
});
