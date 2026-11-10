import { describe, expect, test } from "bun:test";
import { captureControlSnapshot, reconcileHtml, restoreControlSnapshot } from "../../src/html/reconcile";

describe("keyed HTML reconciliation", () => {
  test("preserves keyed identity, edited controls, focus and selection", () => {
    const root = document.createElement("main");
    root.innerHTML = `<label id="label">Name</label><input id="name" value="default"><p data-key="status">old</p>`;
    document.body.append(root);
    const input = root.querySelector<HTMLInputElement>("#name")!;
    const status = root.querySelector("[data-key=status]")!;
    input.value = "user edit";
    input.focus();
    input.setSelectionRange(2, 5);
    reconcileHtml(root, `<p data-key="status" class="fresh">new</p><input id="name" value="new default"><label id="label">Full name</label>`);
    expect(root.querySelector("#name")).toBe(input);
    expect(root.querySelector("[data-key=status]")).toBe(status);
    expect(input.value).toBe("user edit");
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
    expect(status.textContent).toBe("new");
    expect(status.className).toBe("fresh");
    root.remove();
  });

  test("reset reapplies defaults and retyped keys replace nodes", () => {
    const root = document.createElement("main");
    root.innerHTML = `<input id="control" value="one"><div data-key="replace">old</div>`;
    const input = root.querySelector<HTMLInputElement>("#control")!;
    const old = root.querySelector("[data-key=replace]")!;
    input.value = "edited";
    reconcileHtml(root, `<input id="control" value="two"><section data-key="replace">new</section>`, { reset: true });
    expect(root.querySelector("#control")).toBe(input);
    expect(input.value).toBe("two");
    expect(root.querySelector("[data-key=replace]")).not.toBe(old);
    expect(root.querySelector("section")?.textContent).toBe("new");
  });

  test("removes deleted nodes and preserves custom element instances", () => {
    const root = document.createElement("main");
    root.innerHTML = `<slex-card id="card"><span id="child">old</span></slex-card><aside id="gone"></aside>`;
    const card = root.querySelector("#card")!;
    reconcileHtml(root, `<slex-card id="card"><span id="child">new</span></slex-card>`);
    expect(root.querySelector("#card")).toBe(card);
    expect(root.querySelector("#child")?.textContent).toBe("new");
    expect(root.querySelector("#gone")).toBeNull();
  });

  test("accepts changed defaults for untouched native controls but preserves dirty values", () => {
    const root = document.createElement("main");
    root.innerHTML = `<input id="clean" value="one"><input id="dirty" value="one"><textarea id="note">one</textarea>
      <select id="choice"><option value="a" selected>A</option><option value="b">B</option></select>`;
    const dirty = root.querySelector<HTMLInputElement>("#dirty")!;
    dirty.value = "user";
    reconcileHtml(root, `<input id="clean" value="two"><input id="dirty" value="two"><textarea id="note">two</textarea>
      <select id="choice"><option value="a">A</option><option value="b" selected>B</option></select>`);
    expect(root.querySelector<HTMLInputElement>("#clean")!.value).toBe("two");
    expect(dirty.value).toBe("user");
    expect(root.querySelector<HTMLTextAreaElement>("#note")!.value).toBe("two");
    expect(root.querySelector<HTMLSelectElement>("#choice")!.value).toBe("b");
  });

  test("resets and snapshots actual custom-element visible state", () => {
    const owner = document.defaultView!;
    if (!owner.customElements.get("slex-input")) {
      class TestInput extends owner.HTMLElement {
        static observedAttributes = ["value"];
        private current = "";
        get value() { return this.current; }
        set value(value: unknown) { this.current = String(value ?? ""); }
        attributeChangedCallback(_name: string, _old: string | null, value: string | null) { this.current = value ?? ""; }
      }
      owner.customElements.define("slex-input", TestInput);
    }
    const root = document.createElement("main");
    root.innerHTML = `<slex-input id="custom" value="one"></slex-input>`;
    const control = root.querySelector("#custom") as HTMLElement & { value: string };
    control.value = "user";
    const snapshot = captureControlSnapshot(root);
    reconcileHtml(root, `<slex-input id="custom" value="two"></slex-input>`);
    expect(control.value).toBe("user");
    control.value = "later";
    restoreControlSnapshot(root, snapshot);
    expect(control.value).toBe("user");
    reconcileHtml(root, `<slex-input id="custom" value="three"></slex-input>`, { reset: true });
    expect(control.value).toBe("three");
  });

  test("preserves custom controls with omitted defaults and select identity after reorder", () => {
    const root = document.createElement("main");
    root.innerHTML = '<slex-input id="custom"></slex-input><select id="choice"><option value="a">A</option><option value="b">B</option></select>';
    const custom = root.querySelector("slex-input") as HTMLElement & { value: string };
    custom.value = "typed without a default";
    const select = root.querySelector("select")!;
    select.value = "b";
    reconcileHtml(root, '<slex-input id="custom" label="New label"></slex-input><select id="choice"><option value="b">B</option><option value="a">A</option></select>');
    expect(custom.value).toBe("typed without a default");
    expect(select.value).toBe("b");
    expect(select.selectedIndex).toBe(0);
  });
});
