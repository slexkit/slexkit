import { describe, expect, it } from "bun:test";
import { mount, mountSecureArtifact, slexkitStd, validateSlexSource } from "../../src/index";

describe("SlexKit stdlib", () => {
  it("covers the curated stdlib function surface", () => {
    expect(slexkitStd.math.clamp(12, 0, 10)).toBe(10);
    expect(slexkitStd.math.round(1.234, 2)).toBe(1.23);
    expect(slexkitStd.math.safeDivide(1, 0, 9)).toBe(9);
    expect(slexkitStd.math.percent(1, 4, 1)).toBe(25);
    expect(slexkitStd.math.lerp(10, 20, 0.25)).toBe(12.5);

    expect(slexkitStd.stats.sum([1, "2", Infinity, "x"])).toBe(3);
    expect(slexkitStd.stats.mean([1, 2, 3])).toBe(2);
    expect(slexkitStd.stats.min([])).toBeNaN();
    expect(slexkitStd.stats.max([])).toBeNaN();
    expect(slexkitStd.stats.median([3, 1, 2, 4])).toBe(2.5);

    expect(slexkitStd.format.fixed(1.234, 2)).toBe("1.23");
    expect(slexkitStd.format.number(1234.5, 1)).toBe("1,234.5");
    expect(slexkitStd.format.compact(1234, 1)).toBe("1.2K");
    expect(slexkitStd.format.percent(0.125, 1)).toBe("12.5%");
    expect(slexkitStd.format.currency(12.5, "USD")).toBe("$12.50");

    expect(slexkitStd.units.withUnit(12.345, "ms", 1)).toBe("12.3 ms");
    expect(slexkitStd.units.bytes(1536, 1)).toBe("1.5 KB");
    expect(slexkitStd.units.duration(1500, 1)).toBe("1.5 s");
    expect(slexkitStd.units.si(1500, "Hz", 1)).toBe("1.5 kHz");
  });

  it("injects std into reads, conditions, loops, and event handlers", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;

    mount({
      namespace: `std_runtime_${Date.now()}`,
      g: { value: 150, visible: true, values: [1, 2, 3], total: 0 },
      layout: {
        "card:main": {
          $if: "std.math.clamp(g.value, 0, 100) === 100 && g.visible",
          "button:add": {
            label: "Add",
            onclick: "g.total = std.stats.sum(g.values)",
          },
          "text:item": {
            $for: "g.values",
            $key: "$value",
            "$text": "std.format.fixed($item, 1)",
          },
          "text:total": {
            "$text": "'total:' + std.format.fixed(g.total, 0)",
          },
        },
      },
    }, container);

    expect(container.textContent).toContain("1.0");
    expect(container.textContent).toContain("2.0");
    expect(container.textContent).toContain("3.0");
    (container.querySelector("button") as HTMLButtonElement).click();
    expect(container.textContent).toContain("total:6");
  });

  it("does not let component names or $for aliases shadow std", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;

    mount({
      namespace: `std_shadow_${Date.now()}`,
      g: { items: [{ id: "a", std: "bad" }] },
      layout: {
        "text:std": {
          $for: "g.items",
          $key: "id",
          "$text": "std.format.fixed(1.2, 1)",
        },
      },
    }, container);

    expect(container.textContent).toContain("1.2");
  });

  it("injects std into secure inline execution", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;

    mountSecureArtifact({
      namespace: `std_secure_${Date.now()}`,
      g: { bytes: 2048 },
      layout: {
        "text:bytes": {
          "$text": "std.units.bytes(g.bytes)",
        },
      },
    }, container, {
      policy: {},
      unsafeInlineExecution: true,
    });

    expect(container.textContent).toContain("2.0 KB");
  });

  it("validates std, api, components, props, and secure native capabilities with warnings", () => {
    const result = validateSlexSource(`{
      slex: "0.1",
      namespace: "warnings",
      g: { load: function () { fetch("/x"); api.socket(); return std.math.nope(1); } },
      layout: {
        "unknown:thing": { text: "x" },
        "text:message": { madeUp: true, "$text": "std.format.fixed(1, 1)" }
      }
    }`, { mode: "secure" });

    expect(result.ok).toBe(true);
    expect(result.componentUsage).toContain("text");
    expect(result.stdlibUsage).toContain("std.format.fixed");
    expect(result.stdlibUsage).toContain("std.math.nope");
    expect(result.apiUsage).toContain("api.socket");
    expect(result.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "unknown_component",
      "unknown_prop",
      "unknown_std_member",
      "unknown_api_member",
      "native_secure_capability",
    ]));
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "unknown_std_member", path: "g.load", value: "std.math.nope" }),
      expect.objectContaining({ code: "unknown_api_member", path: "g.load", value: "api.socket" }),
      expect.objectContaining({ code: "native_secure_capability", path: "g.load", value: "fetch" }),
      expect.objectContaining({ code: "unknown_prop", path: "layout.text:message.madeUp", value: "madeUp" }),
    ]));
  });
});
