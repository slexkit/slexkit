import { describe, expect, it } from "bun:test";
import { formatStatValue } from "../../src/components/svelte/display/stat-format";

const measureCharacters = (text: string) => text.length;

describe("stat value formatting", () => {
  it("rounds ordinary numbers to at most six significant digits", () => {
    expect(formatStatValue(123.456789)).toBe("123.457");
    expect(formatStatValue(0.1 + 0.2)).toBe("0.3");
    expect(formatStatValue(999_999.9)).toBe("1e6");
    expect(formatStatValue(-0)).toBe("0");
  });

  it("keeps finite extremes meaningful and preserves non-finite values", () => {
    expect(formatStatValue(Number.MIN_VALUE)).toBe("4.94066e-324");
    expect(formatStatValue(Number.MAX_VALUE)).toBe("1.79769e308");
    expect(formatStatValue(Number.NaN)).toBe("NaN");
    expect(formatStatValue(Number.POSITIVE_INFINITY)).toBe("Infinity");
    expect(formatStatValue(Number.NEGATIVE_INFINITY)).toBe("-Infinity");
  });

  it("preserves authored strings until a safe measured reformat is needed", () => {
    expect(formatStatValue("1.000")).toBe("1.000");
    expect(formatStatValue("1.2k")).toBe("1.2k");
    expect(formatStatValue("N/A")).toBe("N/A");
    expect(formatStatValue("00123")).toBe("00123");
    expect(formatStatValue("9007199254740993")).toBe("9007199254740993");

    expect(
      formatStatValue("1.000", { width: 5, measure: measureCharacters }),
    ).toBe("1.000");
    expect(
      formatStatValue("1.000", { width: 1, measure: measureCharacters }),
    ).toBe("1");
  });

  it("only reformats strict, finite, safely coercible numeric strings", () => {
    const narrow = { width: 2, measure: measureCharacters };

    expect(formatStatValue("1e309", narrow)).toBe("1e309");
    expect(formatStatValue("1e-400", narrow)).toBe("1e-400");
    expect(formatStatValue("9007199254740993.0", narrow)).toBe("9007199254740993.0");
    expect(formatStatValue("1234567", narrow)).toBe("1234567");
    expect(formatStatValue("1.2k", narrow)).toBe("1.2k");
    expect(formatStatValue("12abc", narrow)).toBe("12abc");
    expect(formatStatValue(" 12.3 ", narrow)).toBe(" 12.3 ");
  });

  it("adapts precision to measured width without slicing digits", () => {
    expect(
      formatStatValue(123.456789, { width: 6, measure: measureCharacters }),
    ).toBe("123.46");
    expect(
      formatStatValue(123_456_789, { width: 8, measure: measureCharacters }),
    ).toBe("1.2346e8");
    expect(
      formatStatValue("123.456789", { width: 6, measure: measureCharacters }),
    ).toBe("123.46");
  });

  it("uses the shortest meaningful candidate when no candidate fits", () => {
    expect(
      formatStatValue(0.00012345, { width: 1, measure: measureCharacters }),
    ).toBe("1e-4");
    expect(
      formatStatValue(12.345, { width: 0, measure: measureCharacters }),
    ).toBe("12");
  });

  it("handles empty values without mutating caller-owned input", () => {
    const input = { value: 12 };

    expect(formatStatValue(null)).toBe("");
    expect(formatStatValue(undefined)).toBe("");
    expect(formatStatValue(input)).toBe("[object Object]");
    expect(input).toEqual({ value: 12 });
  });
});
