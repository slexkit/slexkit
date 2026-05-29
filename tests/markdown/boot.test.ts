import { describe, expect, it, mock } from "bun:test";
import { boot } from "../../src/engine/index";
import "../../src/components/index";

describe("markdown boot source controls", () => {
  it("boot renders only language-slex and keeps source controls", () => {
    document.body.innerHTML = `
      <pre><code class="language-slex">{
        namespace: "boot_source",
        g: {},
        layout: { "text:msg": { text: "Rendered" } }
      }</code></pre>
      <pre><code class="language-js">const namespace = "not_slexkit";</code></pre>
      <pre><code class="language-slex-js">not mounted</code></pre>
      <pre><code class="language-slexkit">not mounted</code></pre>
      <pre><code class="language-slexkit-js">not mounted</code></pre>
    `;

    boot();

    expect(document.querySelectorAll(".slexkit-card")).toHaveLength(1);
    expect(document.querySelectorAll(".slexkit-source-toolbar")).toHaveLength(1);
    expect(document.querySelector(".slexkit-root")?.textContent).toContain("Rendered");
    expect(document.querySelector("pre")?.hidden).toBe(false);
  });

  it("source toolbar can copy, hide, and re-render the original code block", () => {
    const writeText = mock().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    document.body.innerHTML = `
      <pre><code class="language-slex">{
        namespace: "boot_toolbar",
        g: {},
        layout: { "text:msg": { text: "Before" } }
      }</code></pre>
    `;

    boot();

    const pre = document.querySelector("pre") as HTMLPreElement;
    const code = document.querySelector("code.language-slex") as HTMLElement;
    const buttons = Array.from(document.querySelectorAll(".slexkit-source-button")) as HTMLButtonElement[];

    buttons[0].click();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("boot_toolbar"));

    buttons[1].click();
    expect(pre.hidden).toBe(true);
    buttons[1].click();
    expect(pre.hidden).toBe(false);

    code.textContent = `{
      namespace: "boot_toolbar",
      g: {},
      layout: { "text:msg": { text: "After" } }
    }`;
    buttons[2].click();
    expect(document.querySelector(".slexkit-root")?.textContent).toContain("After");
  });
});
