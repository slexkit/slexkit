import { expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

it("retains active tab light-DOM input across tab changes", async () => {
  const one = document.createElement("section"); one.slot = "one"; one.dataset.label = "One";
  const input = document.createElement("input"); input.value = "edited"; one.append(input);
  const two = document.createElement("section"); two.slot = "two"; two.dataset.label = "Two";
  const tabs = mountSlexElement("tabs", { value: "one" }, [one, two]);
  input.focus(); input.setSelectionRange(1, 3);
  tabs.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click(); await Promise.resolve();
  tabs.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')[0].click(); await Promise.resolve();
  expect(tabs.querySelector("input")).toBe(input); expect(input.value).toBe("edited");
});
