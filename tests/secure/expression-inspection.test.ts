import { expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";
import { reconcileHtml } from "../../src/html/reconcile";

it("rejects removed expression strings and checks module syntax without evaluating it", () => {
  expect(inspectSlexSource('({layout:{"text:a":{$text:"g.value"}}})').diagnostic?.code)
    .toBe("legacy-object-source");
  (globalThis as { __inspectionProbe?: number }).__inspectionProbe = 0;
  const valid = inspectSlexSource('<script>globalThis.__inspectionProbe++; while(true){}</script>');
  expect(valid.ok).toBe(true);
  expect((globalThis as { __inspectionProbe?: number }).__inspectionProbe).toBe(0);
  expect(inspectSlexSource('<script>if (</script>').diagnostic?.code).toBe("invalid-module-script");
  delete (globalThis as { __inspectionProbe?: number }).__inspectionProbe;
});

it("keeps the last committed DOM when static preview inspection fails", () => {
  const root = document.createElement("div");
  reconcileHtml(root, '<input id="value" value="seed">');
  const input = root.querySelector("input")!;
  input.value = "dirty";
  const preview = inspectSlexSource('<script>if (</script>');
  if (preview.ok) reconcileHtml(root, preview.value!);
  expect(root.querySelector("input")).toBe(input);
  expect(input.value).toBe("dirty");
});
