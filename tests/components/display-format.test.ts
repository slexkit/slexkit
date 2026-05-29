import { describe, expect, it } from "bun:test";
import { text } from "../../src/components/svelte/helpers";

describe("display text formatting", () => {
  it("formats common floating point tails for visible numeric text", () => {
    expect(text(100.00000000000001)).toBe("100");
    expect(text(0.1 + 0.2)).toBe("0.3");
    expect(text(0.00009999999999999999)).toBe("0.0001");
  });

  it("preserves authored strings exactly", () => {
    expect(text("12.30")).toBe("12.30");
    expect(text("100.00000000000001nF")).toBe("100.00000000000001nF");
  });
});
