import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";
import { reconcileHtml } from "../../src/html/reconcile";

describe("HTML error boundary behavior", () => {
  it("static failures do not replace the last good committed view", () => {
    const root = document.createElement("div"); reconcileHtml(root, '<p id="good">Good</p>');
    const good = root.firstElementChild;
    const next = inspectSlexSource("<script>if (</script>");
    if (next.ok) reconcileHtml(root, next.value!);
    expect(root.firstElementChild).toBe(good); expect(root.textContent).toBe("Good");
  });

  it("does not expose an expression parameter or last-good eval cache", () => {
    expect(inspectSlexSource('({layout:{"text:x":{$text:"missing.value"}}})').diagnostic?.code)
      .toBe("legacy-object-source");
  });
});
