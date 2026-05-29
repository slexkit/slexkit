import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

function sleep(ms = 30) {
  return new Promise((r) => setTimeout(r, ms));
}

function unique(ns = "v017") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("tabs component", () => {
  it("removes Flowbite's default gray panel chrome from tab content", async () => {
    const css = await Bun.file("src/styles/components/tabs.css").text();

    expect(css).toContain(".slex-tabs-content");
    expect(css).toContain("background: transparent !important;");
    expect(css).toContain("margin-top: 0.75rem !important;");
    expect(css).toContain('.slex-tabs[data-orientation="vertical"] .slex-tabs-content');
    expect(css).toContain("margin-left: 0.75rem !important;");
    expect(css).toContain("border-radius: 0 !important;");
    expect(css).toContain("padding: 0 !important;");
  });

  it("renders data-orientation and tab switching", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const emitted: unknown[] = [];
    const ns = unique("tabs_orient");
    mount(
      {
        namespace: ns,
        g: {
          active: "tab1",
          onChange(x: unknown) { emitted.push(x); },
        },
        layout: {
          "tabs:tb": {
            $value: "g.active",
            onchange: "g.active = $event; g.onChange($event)",
            tabs: [
              { value: "tab1", label: "Tab 1" },
              { value: "tab2", label: "Tab 2" },
              { value: "tab3", label: "Tab 3" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-tabs");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("data-orientation")).toBe("horizontal");
    expect(root!.querySelector(".slex-tabs-selected-indicator")).toBeTruthy();
    // Tab1 should be selected initially
    let triggers = root!.querySelectorAll(".slex-tabs-trigger");
    expect(triggers).toHaveLength(3);
    expect(triggers[0].classList.contains("slex-tabs-trigger--selected")).toBe(true);
    expect(triggers[1].classList.contains("slex-tabs-trigger--selected")).toBe(false);
    // Click tab2
    (triggers[1] as HTMLElement).click();
    await sleep(50);
    // @change should fire with tab2 value
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toBe("tab2");
    triggers = root!.querySelectorAll(".slex-tabs-trigger");
    expect(triggers[0].classList.contains("slex-tabs-trigger--selected")).toBe(false);
    expect(triggers[1].classList.contains("slex-tabs-trigger--selected")).toBe(true);
  });

  it("renders rich component content inside tab panels", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("tabs_content");
    mount(
      {
        namespace: ns,
        g: { active: "cursor" },
        layout: {
          "tabs:tb": {
            $value: "g.active",
            onchange: "g.active = $event",
            tabs: [
              {
                value: "cursor",
                label: "Cursor",
                content: {
                  "code-block:cursor": {
                    title: "Cursor",
                    language: "json",
                    code: "{\n  \"mcpServers\": {}\n}",
                  },
                },
              },
              {
                value: "codex",
                label: "Codex",
                content: {
                  "code-block:codex": {
                    title: "Codex",
                    language: "toml",
                    code: "[mcp_servers.slexkit]",
                  },
                },
              },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-code-block-title")?.textContent).toContain("Cursor");
    expect(document.querySelector(".slex-code-block-language")?.textContent).toBe("json");
    (document.querySelectorAll(".slex-tabs-trigger")[1] as HTMLElement).click();
    await sleep(50);
    expect(document.querySelector(".slex-code-block-title")?.textContent).toContain("Codex");
    expect(document.querySelector(".slex-code-block-language")?.textContent).toBe("toml");
  });

  it("uses duotone icons for selected icon tabs", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("tabs_icons");
    mount(
      {
        namespace: ns,
        g: { active: "render" },
        layout: {
          "tabs:tb": {
            $value: "g.active",
            onchange: "g.active = $event",
            tabs: [
              { value: "render", label: "Render", icon: "eye", iconOnly: true },
              { value: "code", label: "Code", icon: "code", iconOnly: true },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );

    let triggers = document.querySelectorAll(".slex-tabs-trigger");
    expect(triggers[0].innerHTML).toContain('opacity="0.2"');
    expect(triggers[1].innerHTML).not.toContain('opacity="0.2"');

    (triggers[1] as HTMLElement).click();
    await sleep(50);
    triggers = document.querySelectorAll(".slex-tabs-trigger");
    expect(triggers[0].innerHTML).not.toContain('opacity="0.2"');
    expect(triggers[1].innerHTML).toContain('opacity="0.2"');
  });

  it("keeps icon labels readable when tabs are not icon-only", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("tabs_icon_labels");
    mount(
      {
        namespace: ns,
        g: { active: "overview" },
        layout: {
          "tabs:tb": {
            $value: "g.active",
            tabs: [
              { value: "overview", label: "Overview", icon: "eye" },
              { value: "settings", label: "Settings", icon: "code" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );

    const triggers = document.querySelectorAll(".slex-tabs-trigger");
    expect(triggers[0].classList.contains("slex-tabs-trigger--with-icon")).toBe(true);
    expect(triggers[0].classList.contains("slex-tabs-trigger--icon")).toBe(false);
    expect(triggers[0].textContent).toContain("Overview");
  });

  it("keeps async tab icons visible while selected variants load", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("tabs_async_icon_fallback");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL) => {
      const url = String(input);
      const selected = url.includes("duotone");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            text: async () => selected
              ? '<svg data-icon="selected" viewBox="0 0 16 16"></svg>'
              : '<svg data-icon="regular" viewBox="0 0 16 16"></svg>',
          } as Response);
        }, selected ? 100 : 0);
      });
    }) as typeof fetch;

    try {
      mount(
        {
          namespace: ns,
          g: { active: "overview" },
          layout: {
            "tabs:tb": {
              $value: "g.active",
              onchange: "g.active = $event",
              tabs: [
                { value: "overview", label: "Overview", icon: "eye" },
                { value: "activity", label: "Activity", icon: "tabs-remote-activity" },
              ],
            },
          },
        },
        document.getElementById("app")!,
      );

      await sleep(50);
      let triggers = document.querySelectorAll(".slex-tabs-trigger");
      expect(triggers[1].innerHTML).toContain('data-icon="regular"');

      (triggers[1] as HTMLElement).click();
      await sleep(10);
      triggers = document.querySelectorAll(".slex-tabs-trigger");
      expect(triggers[1].classList.contains("slex-tabs-trigger--with-icon")).toBe(true);
      expect(triggers[1].innerHTML).toContain('data-icon="regular"');

      await sleep(120);
      triggers = document.querySelectorAll(".slex-tabs-trigger");
      expect(triggers[1].querySelector(".slex-tabs-trigger-icon")).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("$value binding syncs active tab + @change event", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("tabs_sync");
    const emitted: unknown[] = [];
    const container = document.getElementById("app")!;
    mount(
      {
        namespace: ns,
        g: {
          active: "tab1",
          onChange(x: unknown) { emitted.push(x); },
        },
        layout: {
          "tabs:tb": {
            $value: "g.active",
            onchange: "g.active = $event; g.onChange($event)",
            tabs: [
              { value: "tab1", label: "Tab 1" },
              { value: "tab2", label: "Tab 2" },
            ],
          },
        },
      },
      container,
    );
    const triggers = document.querySelectorAll(".slex-tabs-trigger");
    expect(triggers[0].getAttribute("data-selected")).toBe("");
    // Click tab2
    (triggers[1] as HTMLElement).click();
    await sleep(50);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toBe("tab2");
    // Remount with active=tab1 to test external sync
    mount(
      {
        namespace: ns,
        g: {
          active: "tab1",
          onChange(x: unknown) { /* noop */ },
        },
        layout: {
          "tabs:tb": {
            $value: "g.active",
            onchange: "g.onChange($event)",
            tabs: [
              { value: "tab1", label: "Tab 1" },
              { value: "tab2", label: "Tab 2" },
            ],
          },
        },
      },
      container,
    );
    await sleep(50);
    const triggers2 = document.querySelectorAll(".slex-tabs-trigger");
    expect(triggers2[0].getAttribute("data-selected")).toBe("");
  });
});
