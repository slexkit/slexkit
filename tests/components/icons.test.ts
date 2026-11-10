import { afterEach, describe, expect, it } from "bun:test";
import {
  clearRegisteredIcons,
  getIcon,
  iconifySvgUrl,
  loadIcon,
  normalizeIconName,
  registerIcon,
  resolveIconifyIcon,
} from "../../src/icons/manager";
import { mountSlexElement } from "../helpers";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; clearRegisteredIcons(); document.body.replaceChildren(); });

describe("icon manager through public components", () => {
  it("normalizes names, aliases, and Iconify URLs", () => {
    expect(normalizeIconName("GearSix")).toBe("gear-six");
    expect(resolveIconifyIcon("phosphor:ChartBar", { selected: true })).toEqual({ prefix: "ph", name: "chart-bar-duotone" });
    expect(iconifySvgUrl("ph:chart-bar")).toContain("api.iconify.design/ph/chart-bar.svg");
    const svg = '<svg viewBox="0 0 16 16"><path d="M1 1h14v14H1z"/></svg>';
    registerIcon("brand:LogoMark", svg, { aliases: ["logo-mark"] });
    expect(getIcon("LogoMark")).toBe(svg);
  });

  it("sanitizes remotely loaded SVG before a facade component renders it", async () => {
    globalThis.fetch = (async () => new Response('<svg onload="bad()"><script>bad()</script><path d="M0 0h1"/></svg>')) as typeof fetch;
    const loaded = await loadIcon("demo:unsafe");
    expect(loaded).not.toContain("script");
    expect(loaded).not.toContain("onload");
    const button = mountSlexElement("button", { label: "Run", icon: "demo:unsafe" });
    await Promise.resolve();
    expect(button.shadowRoot!.textContent).toContain("Run");
  });
});
