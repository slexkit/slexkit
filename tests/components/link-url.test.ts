import { expect, it } from "bun:test";
import { linkHref } from "../../src/components/svelte/helpers";

it("blocks executable link schemes including embedded control characters", () => {
  for (const value of ["javascript:alert(1)", " JaVa\nScRiPt:alert(1)", "vbscript:msgbox(1)", "data:text/html,<script>1</script>"]) expect(linkHref(value)).toBe("#");
  for (const value of ["https://example.com/path?q=1", "#section", "../note", "obsidian://open?vault=demo", "mailto:author@example.com"]) expect(linkHref(value)).toBe(value);
});
