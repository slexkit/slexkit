import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";

describe("HTML streaming preview", () => {
  it("performs static inspection without executing handlers or scripts", () => {
    (globalThis as { __previewProbe?: number }).__previewProbe = 0;
    const result = inspectSlexSource('<button id="add">Add</button><script>globalThis.__previewProbe++;document.querySelector("#add").onclick=()=>globalThis.__previewProbe++</script>');
    expect(result.ok).toBe(true);
    expect((globalThis as { __previewProbe?: number }).__previewProbe).toBe(0);
    delete (globalThis as { __previewProbe?: number }).__previewProbe;
  });

  it("rejects incomplete executable scripts instead of evaluating a partial program", () => {
    const result = inspectSlexSource('<p>last committed</p><script>const next =');
    expect(result.ok).toBe(false); expect(result.diagnostics?.map(item => item.code)).toContain("incomplete-script");
  });
});
