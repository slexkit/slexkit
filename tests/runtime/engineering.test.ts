import { describe, expect, it } from "bun:test";
import { parseEngineeringNumber } from "../../src/engine/engineering";

describe("engineering number parser", () => {
  it("parses scientific notation", () => {
    expect(parseEngineeringNumber("1e-3")).toMatchObject({
      raw: "1e-3",
      number: 0.001,
      valid: true,
      prefix: "",
      unit: "",
    });
  });

  it("parses SI prefixes", () => {
    expect(parseEngineeringNumber("4.7k")).toMatchObject({
      number: 4700,
      valid: true,
      prefix: "k",
      unit: "",
    });
  });

  it("parses engineering units after prefixes", () => {
    expect(parseEngineeringNumber("10kΩ")).toMatchObject({
      number: 10000,
      valid: true,
      prefix: "k",
      unit: "Ω",
    });
  });

  it("parses micro unit spellings", () => {
    expect(parseEngineeringNumber("2.2uF")).toMatchObject({
      number: 0.0000022,
      valid: true,
      prefix: "u",
      unit: "F",
    });
    expect(parseEngineeringNumber("2.2µF")).toMatchObject({
      number: 0.0000022,
      valid: true,
      prefix: "µ",
      unit: "F",
    });
  });

  it("returns invalid metadata for invalid strings", () => {
    expect(parseEngineeringNumber("nope")).toMatchObject({
      raw: "nope",
      number: null,
      valid: false,
      error: "invalid_number",
    });
  });
});
