import { expect, it } from "bun:test";
import { defineSlexElements, type SlexElement } from "../../src/web-components";
import { reconcileHtml } from "../../src/html/reconcile";

it("updates mixed controls without duplicate instances or feedback", () => {
  defineSlexElements({ window: window as Window & typeof globalThis, cssText: "" });
  const root = document.createElement("div"); document.body.replaceChildren(root);
  reconcileHtml(root, '<slex-input id="voltage" value="12"></slex-input><input id="note" value="seed"><slex-checkbox id="ok"></slex-checkbox>');
  const voltage = root.querySelector<SlexElement>("#voltage")!; voltage.value = "2k";
  const note = root.querySelector<HTMLInputElement>("#note")!; note.value = "dirty"; note.focus(); note.setSelectionRange(2, 5);
  reconcileHtml(root, '<slex-input id="voltage" value="24" label="Updated"></slex-input><input id="note" value="next" placeholder="Updated"><slex-checkbox id="ok" checked></slex-checkbox>');
  expect(root.querySelector("#voltage")).toBe(voltage); expect(voltage.value).toBe("2k");
  expect(root.querySelector("#note")).toBe(note); expect(note.value).toBe("dirty");
  expect(note.placeholder).toBe("Updated"); expect(note.selectionStart).toBe(2);
});
