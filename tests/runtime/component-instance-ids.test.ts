import { expect, it } from "bun:test";
import { defineSlexElements, type SlexElement } from "../../src/web-components";

function internalIds(element: Element): string[] {
  return Array.from(element.shadowRoot?.querySelectorAll<HTMLElement>("[id]") ?? [], node => node.id);
}

it("isolates generated control IDs and radio names across custom-element instances", async () => {
  defineSlexElements({ window: window as Window & typeof globalThis, cssText: "" });
  const left = document.createElement("slex-radio-group") as SlexElement;
  const right = document.createElement("slex-radio-group") as SlexElement;
  const options = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];
  left.options = options; right.options = options; document.body.replaceChildren(left, right);
  const ids = [...internalIds(left), ...internalIds(right)];
  expect(new Set(ids).size).toBe(ids.length);
  const leftRadio = left.shadowRoot!.querySelector<HTMLInputElement>('input[type="radio"]')!;
  const rightRadio = right.shadowRoot!.querySelector<HTMLInputElement>('input[type="radio"]')!;
  expect(leftRadio.name).not.toBe(rightRadio.name);
  const leftIds = internalIds(left); left.label = "Updated";
  expect(internalIds(left)).toEqual(leftIds);
});
