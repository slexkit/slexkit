import { describe, expect, it } from "bun:test";
import { reconcileHtml } from "../../src/html/reconcile";

describe("incremental HTML tree", () => {
  it("retains compatible nested identity, selection and current handlers", () => {
    const root = document.createElement("div"); document.body.replaceChildren(root);
    reconcileHtml(root, '<section id="card"><input id="editor" value="seed"></section>');
    const input = root.querySelector("input")!; let calls = 0;
    input.addEventListener("input", () => calls++); input.value = "edited"; input.setSelectionRange(1, 3);
    reconcileHtml(root, '<section id="card" class="updated"><input id="editor" value="next"><p>new</p></section>');
    expect(root.querySelector("input")).toBe(input); expect(input.value).toBe("edited");
    expect(input.selectionStart).toBe(1); input.dispatchEvent(new Event("input")); expect(calls).toBe(1);
  });

  it("disposes deleted or retyped nodes by disconnecting them", () => {
    const root = document.createElement("div");
    reconcileHtml(root, '<div id="same"></div><div id="gone"></div>');
    const same = root.querySelector("#same"); const gone = root.querySelector("#gone");
    reconcileHtml(root, '<span id="same"></span>');
    expect(same?.isConnected).toBe(false); expect(gone?.isConnected).toBe(false);
  });
});
