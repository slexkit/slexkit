import { afterEach, describe, expect, it } from "bun:test";
import type { SlexElement } from "../../src/web-components";
import {
  registerToolTemplate,
  renderToolCall,
  type ToolTemplateFactory,
} from "../../src/toolhost/index";

afterEach(async () => {
  document.body.replaceChildren();
  await Promise.resolve();
});

function mountPoint(id = "tool"): HTMLElement {
  const container = document.createElement("div");
  container.id = id;
  document.body.append(container);
  return container;
}

function submitElement(container: HTMLElement): SlexElement {
  return container.querySelector("slex-submit") as SlexElement;
}

function clickSubmit(container: HTMLElement): void {
  submitElement(container).shadowRoot!.querySelectorAll<HTMLButtonElement>("button")[1].click();
}

function clickIgnore(container: HTMLElement): void {
  submitElement(container).shadowRoot!.querySelectorAll<HTMLButtonElement>("button")[0].click();
}

describe("ToolHost HTML templates", () => {
  it("submits selected option-list values and keeps the legacy alias", async () => {
    const container = mountPoint();
    const handle = renderToolCall({
      id: "call_1",
      name: "option-list",
      arguments: {
        title: "Release checks",
        options: [
          { id: "review", label: "Code Review", selected: true },
          { id: "tests", label: "Tests Passing" },
        ],
        submitLabel: "Approve",
      },
    }, container);

    const choices = container.querySelectorAll<SlexElement>("slex-checkbox");
    expect(choices).toHaveLength(2);
    expect(choices[0].checked).toBe(true);
    choices[1].checked = true;
    choices[1].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    clickSubmit(container);

    await expect(handle.promise).resolves.toEqual({
      toolCallId: "call_1",
      toolName: "option-list",
      status: "submitted",
      value: { selected: ["review", "tests"] },
    });
  });

  it("resolves ignored state once", async () => {
    const container = mountPoint();
    const handle = renderToolCall({
      id: "call_2",
      name: "choose-options",
      arguments: { options: [{ id: "skip", label: "Skip" }], ignoreLabel: "Dismiss" },
    }, container);
    clickIgnore(container);
    clickSubmit(container);
    await expect(handle.promise).resolves.toEqual({
      toolCallId: "call_2",
      toolName: "choose-options",
      status: "ignored",
      value: null,
    });
  });

  it("requires a confirmation reason and treats argument strings as text", async () => {
    const container = mountPoint();
    const handle = renderToolCall({
      id: "call_confirm",
      name: "confirm-action",
      arguments: {
        title: '<img src=x onerror="globalThis.pwned=true">',
        description: "This action publishes the release.",
        requireReason: true,
        confirmLabel: "Approve",
      },
    }, container);
    const card = container.querySelector<SlexElement>("slex-card")!;
    const reason = container.querySelector<SlexElement>("slex-input")!;
    expect(card.querySelector("img")).toBeNull();
    expect(submitElement(container).disabled).toBe(true);
    reason.value = "All checks passed";
    reason.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    expect(submitElement(container).disabled).toBe(false);
    clickSubmit(container);
    await expect(handle.promise).resolves.toEqual({
      toolCallId: "call_confirm",
      toolName: "confirm-action",
      status: "submitted",
      value: { confirmed: true, reason: "All checks passed" },
    });
  });

  it("enforces min/max selection and supports a single radio-group choice", async () => {
    const multipleContainer = mountPoint("multiple");
    const multiple = renderToolCall({
      id: "call_choose",
      name: "choose-options",
      arguments: {
        options: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }],
        minSelected: 1,
        maxSelected: 1,
      },
    }, multipleContainer);
    const boxes = multipleContainer.querySelectorAll<SlexElement>("slex-checkbox");
    expect(submitElement(multipleContainer).disabled).toBe(true);
    boxes[0].checked = true;
    boxes[0].dispatchEvent(new Event("change", { bubbles: true }));
    boxes[1].checked = true;
    boxes[1].dispatchEvent(new Event("change", { bubbles: true }));
    expect(boxes[1].checked).toBe(false);
    clickSubmit(multipleContainer);
    await expect(multiple.promise).resolves.toMatchObject({ value: { selected: ["a"] } });

    const singleContainer = mountPoint("single");
    const single = renderToolCall({
      id: "call_single",
      name: "choose-options",
      arguments: {
        multiple: false,
        selected: ["medium"],
        options: [
          { id: "low", label: "Low", description: "Low risk" },
          { id: "medium", label: "Medium" },
          { id: "high", label: "High" },
        ],
      },
    }, singleContainer);
    const radios = singleContainer.querySelector<SlexElement>("slex-radio-group")!;
    expect(radios.value).toBe("medium");
    radios.value = "high";
    radios.dispatchEvent(new Event("change", { bubbles: true }));
    clickSubmit(singleContainer);
    await expect(single.promise).resolves.toMatchObject({ value: { selected: ["high"] } });
  });

  it("returns typed fill-form values", async () => {
    const container = mountPoint();
    const handle = renderToolCall({
      id: "call_form",
      name: "fill-form",
      arguments: {
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "estimate", label: "Estimate", type: "number", value: 2 },
          { name: "approved", label: "Approved", type: "checkbox" },
        ],
      },
    }, container);
    const title = container.querySelector<SlexElement>('[data-field-name="title"]')!;
    const estimate = container.querySelector<SlexElement>('[data-field-name="estimate"]')!;
    const approved = container.querySelector<SlexElement>('[data-field-name="approved"]')!;
    expect(submitElement(container).disabled).toBe(true);
    title.value = "Ship template registry";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    estimate.value = "5";
    estimate.dispatchEvent(new Event("input", { bubbles: true }));
    approved.checked = true;
    approved.dispatchEvent(new Event("change", { bubbles: true }));
    clickSubmit(container);
    await expect(handle.promise).resolves.toMatchObject({
      value: { title: "Ship template registry", estimate: 5, approved: true },
    });
  });

  it("validates engineering fields before submission", async () => {
    const container = mountPoint();
    const handle = renderToolCall({
      id: "call_engineering_form",
      name: "fill-form",
      arguments: {
        fields: [{ name: "resistance", type: "engineering", required: true }],
      },
    }, container);
    const input = container.querySelector<SlexElement>("slex-input")!;
    input.value = "bad";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(submitElement(container).disabled).toBe(true);
    input.value = "4.7k";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(submitElement(container).disabled).toBe(false);
    clickSubmit(container);
    await expect(handle.promise).resolves.toMatchObject({ value: { resistance: 4700 } });
  });

  it("supports a trusted DOM factory for multi-step native interactions", async () => {
    const factory: ToolTemplateFactory = (_args, runtime, _call, document) => {
      const root = document.createElement("slex-card");
      const selected: string[] = [];
      const renderStrategy = () => {
        const step = document.createElement("slex-step") as SlexElement;
        Object.assign(step, { title: "Release strategy", index: 1, total: 2 });
        const choice = document.createElement("slex-radio-group") as SlexElement;
        choice.options = [{ value: "canary", label: "10% canary" }, { value: "full", label: "Full" }];
        choice.value = selected[0] ?? "";
        const next = document.createElement("slex-button") as SlexElement;
        Object.assign(next, { label: "Continue", disabled: selected.length === 0 });
        choice.addEventListener("change", () => {
          selected.splice(0, selected.length, String(choice.value));
          next.disabled = false;
        });
        next.addEventListener("click", renderConstraints);
        step.append(choice, next);
        root.replaceChildren(step);
      };
      const renderConstraints = () => {
        const step = document.createElement("slex-step") as SlexElement;
        Object.assign(step, { title: "Engineering constraints", index: 2, total: 2 });
        const back = document.createElement("slex-button") as SlexElement;
        Object.assign(back, { label: "Back to strategy" });
        back.addEventListener("click", renderStrategy);
        const submit = document.createElement("slex-submit");
        submit.addEventListener("submit", () => runtime.submit({ selected: [...selected] }));
        step.append(back, submit);
        root.replaceChildren(step);
      };
      renderStrategy();
      return root;
    };
    registerToolTemplate("step-test", factory);
    const container = mountPoint();
    const handle = renderToolCall({ id: "call_step", name: "step-test" }, container);
    const choice = container.querySelector<SlexElement>("slex-radio-group")!;
    choice.value = "full";
    choice.dispatchEvent(new Event("change", { bubbles: true }));
    (container.querySelector("slex-button") as SlexElement).dispatchEvent(new Event("click"));
    expect((container.querySelector("slex-step") as SlexElement).title).toBe("Engineering constraints");
    clickSubmit(container);
    await expect(handle.promise).resolves.toMatchObject({ value: { selected: ["full"] } });
  });

  it("rejects unknown templates and duplicate form names", () => {
    expect(() => renderToolCall({ name: "missing-template" }, mountPoint()))
      .toThrow("Unknown tool template");
    expect(() => renderToolCall({
      name: "fill-form",
      arguments: { fields: [{ name: "same" }, { name: "same" }] },
    }, mountPoint("duplicates"))).toThrow("field names must be unique");
  });

  it("disposes custom DOM and factory resources without resolving the promise", () => {
    let disposed = false;
    registerToolTemplate("custom-template", (_args, _runtime, _call, document) => ({
      node: document.createElement("slex-card"),
      dispose: () => { disposed = true; },
    }));
    const container = mountPoint();
    const handle = renderToolCall({ name: "custom-template" }, container);
    expect(container.querySelector("slex-card")).toBeTruthy();
    handle.dispose();
    handle.dispose();
    expect(disposed).toBe(true);
    expect(container.childElementCount).toBe(0);
  });
});
