import { describe, expect, test } from "bun:test";
import { decodeCssDataUrl } from "../../src/web-components/styles";
import { createHash } from "node:crypto";
import { COMPONENT_BASE_STYLE, COMPONENT_BASE_STYLE_HASH } from "../../src/web-components/base-style";

describe("native stylesheet preparation", () => {
  test("the sandbox CSP hash matches the exact custom-element base stylesheet", () => {
    const actual = createHash("sha256").update(COMPONENT_BASE_STYLE).digest("base64");
    expect(COMPONENT_BASE_STYLE_HASH).toBe(`'sha256-${actual}'`);
  });
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
