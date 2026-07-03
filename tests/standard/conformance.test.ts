import { describe, expect, it } from "bun:test";
import { runSlexConformance, validateSlexSource } from "../../src/runtime";

describe("Slex conformance runner", () => {
  it("passes the bundled standard fixtures", () => {
    const report = runSlexConformance();
    expect(report.ok).toBe(true);
    expect(report.total).toBeGreaterThanOrEqual(16);
    expect(report.passed).toBe(report.total);
    expect(report.failed).toBe(0);
    expect(report.cases.every((item) => item.ok)).toBe(true);
  });

  it("can run a single fixture by id", () => {
    const report = runSlexConformance({ fixtureId: "warning-unknown-std-api" });
    expect(report.ok).toBe(true);
    expect(report.total).toBe(1);
    expect(report.fixtureId).toBe("warning-unknown-std-api");
    expect(report.cases[0]).toMatchObject({
      id: "warning-unknown-std-api",
      actual: {
        warnings: expect.arrayContaining([
          expect.objectContaining({ code: "unknown_api_member", path: "g.load", value: "api.socket" }),
          expect.objectContaining({ code: "unknown_std_member", path: "layout.text:value.$text", value: "std.math.nope" }),
        ]),
      },
    });
  });

  it("reports unknown fixture ids without throwing", () => {
    const report = runSlexConformance({ fixtureId: "missing-fixture" });
    expect(report.ok).toBe(false);
    expect(report.total).toBe(0);
    expect(report.error).toContain("missing-fixture");
  });

  it("keeps direct source validation separate from conformance", () => {
    const result = validateSlexSource('{ slex: "0.1", namespace: "single", layout: { "text:message": { text: "ok" } } }');
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
