import { describe, expect, test } from "bun:test";
import { decodeCssDataUrl } from "../../src/web-components/styles";

describe("native stylesheet preparation", () => {
  test("decodes percent-encoded and base64 UTF-8 CSS data URLs", () => {
    const css = ".探针{color:rgb(1, 2, 3)}";
    const bytes = new TextEncoder().encode(css);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    expect(decodeCssDataUrl(`data:text/css;charset=utf-8,${encodeURIComponent(css)}`)).toBe(css);
    expect(decodeCssDataUrl(`data:text/css;base64,${btoa(binary)}`)).toBe(css);
  });

  test("rejects non-CSS, unsupported charset, and malformed data", () => {
    expect(() => decodeCssDataUrl("data:text/html,body{}")).toThrow("text/css");
    expect(() => decodeCssDataUrl("data:text/css;charset=latin1,body{}")).toThrow("UTF-8");
    expect(() => decodeCssDataUrl("data:text/css;base64,%%%")).toThrow("valid UTF-8 CSS");
  });
});
