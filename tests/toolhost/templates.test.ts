import { describe, expect, it, mock } from "bun:test";
import "../../tests/setup.ts";
import { boot, mount } from "../../src/engine/index";
import { renderToolCall, registerToolTemplate } from "../../src/toolhost/index";
import type { ToolTemplateCompiler } from "../../src/toolhost/index";
import "../../src/components/index";

function sleep(ms = 40) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("ToolHost templates", () => {



    it("option-list tool template resolves submitted selected values", async () => {

      document.body.innerHTML = '<div id="tool"></div>';



      const handle = renderToolCall(

        {

          id: "call_1",

          name: "option-list",

          arguments: {

            title: "Release checks",

            options: [

              { id: "review", label: "Code Review", selected: true },

              { id: "tests", label: "Tests Passing" },

            ],

            submitLabel: "Approve",

            ignoreLabel: "Cancel",

          },

        },

        document.getElementById("tool")!,

      );



      const items = document.querySelectorAll(".slex-checkbox");

      expect(items).toHaveLength(2);

      (items[1] as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      await sleep();



      const submit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Approve") as HTMLButtonElement;

      submit.click();



      await expect(handle.promise).resolves.toEqual({

        toolCallId: "call_1",

        toolName: "option-list",

        status: "submitted",

        value: { selected: ["review", "tests"] },

      });

    });




    it("option-list tool template resolves ignored state", async () => {

      document.body.innerHTML = '<div id="tool"></div>';



      const handle = renderToolCall(

        {

          id: "call_2",

          name: "option-list",

          arguments: {

            options: [{ id: "skip", label: "Skip" }],

            ignoreLabel: "Dismiss",

          },

        },

        document.getElementById("tool")!,

      );



      const ignore = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Dismiss") as HTMLButtonElement;

      ignore.click();



      await expect(handle.promise).resolves.toEqual({

        toolCallId: "call_2",

        toolName: "option-list",

        status: "ignored",

        value: null,

      });

    });




    it("confirm-action requires a reason before submitting", async () => {

      document.body.innerHTML = '<div id="tool"></div>';



      const handle = renderToolCall(

        {

          id: "call_confirm",

          name: "confirm-action",

          arguments: {

            title: "Approve release",

            description: "This action publishes the release.",

            requireReason: true,

            confirmLabel: "Approve",

            ignoreLabel: "Cancel",

          },

        },

        document.getElementById("tool")!,

      );



      const submit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Approve") as HTMLButtonElement;

      expect(submit.disabled).toBe(true);



      const reason = document.querySelector(".slex-input") as HTMLInputElement;

      reason.value = "All checks passed";

      reason.dispatchEvent(new InputEvent("input", { bubbles: true }));

      await sleep();



      expect(submit.disabled).toBe(false);

      submit.click();



      await expect(handle.promise).resolves.toEqual({

        toolCallId: "call_confirm",

        toolName: "confirm-action",

        status: "submitted",

        value: { confirmed: true, reason: "All checks passed" },

      });

    });




    it("choose-options supports canonical name, min/max, and option-list alias", async () => {

      document.body.innerHTML = '<div id="tool"></div><div id="alias"></div>';



      const handle = renderToolCall(

        {

          id: "call_choose",

          name: "choose-options",

          arguments: {

            options: [

              { id: "a", label: "Alpha" },

              { id: "b", label: "Beta" },

            ],

            minSelected: 1,

            maxSelected: 1,

            submitLabel: "Choose",

          },

        },

        document.getElementById("tool")!,

      );



      const submit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Choose") as HTMLButtonElement;

      expect(submit.disabled).toBe(true);



      const items = document.querySelectorAll(".slex-checkbox");

      (items[0] as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      await sleep();

      (items[1] as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      await sleep();

      expect(submit.disabled).toBe(false);

      submit.click();



      await expect(handle.promise).resolves.toEqual({

        toolCallId: "call_choose",

        toolName: "choose-options",

        status: "submitted",

        value: { selected: ["a"] },

      });



      const alias = renderToolCall(

        {

          id: "call_alias",

          name: "option-list",

          arguments: {

            options: [{ id: "legacy", label: "Legacy" }],

            selected: ["legacy"],

          },

        },

        document.getElementById("alias")!,

      );

      const aliasSubmit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Submit") as HTMLButtonElement;

      aliasSubmit.click();



      await expect(alias.promise).resolves.toMatchObject({

        toolCallId: "call_alias",

        toolName: "option-list",

        status: "submitted",

        value: { selected: ["legacy"] },

      });

    });




    it("choose-options renders radio group for single-choice calls", async () => {

      document.body.innerHTML = '<div id="tool"></div>';



      const handle = renderToolCall(

        {

          id: "call_single",

          name: "choose-options",

          arguments: {

            multiple: false,

            selected: ["medium"],

            options: [

              { id: "low", label: "Low" },

              { id: "medium", label: "Medium" },

              { id: "high", label: "High" },

            ],

            submitLabel: "Use priority",

          },

        },

        document.getElementById("tool")!,

      );



      expect(document.querySelector(".slex-radio-group")).toBeTruthy();

      expect(document.querySelector(".slex-checkbox")).toBeFalsy();



      const radios = document.querySelectorAll(".slex-radio");

      (radios[2] as HTMLElement).click();

      await sleep();



      const submit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Use priority") as HTMLButtonElement;

      submit.click();



      await expect(handle.promise).resolves.toEqual({

        toolCallId: "call_single",

        toolName: "choose-options",

        status: "submitted",

        value: { selected: ["high"] },

      });

    });




    it("fill-form returns bound field values", async () => {

      document.body.innerHTML = '<div id="tool"></div>';



      const handle = renderToolCall(

        {

          id: "call_form",

          name: "fill-form",

          arguments: {

            title: "Create task",

            fields: [

              { name: "title", label: "Title", type: "text", required: true },

              { name: "estimate", label: "Estimate", type: "number", value: 2 },

              { name: "approved", label: "Approved", type: "checkbox", value: false },

            ],

            submitLabel: "Create",

          },

        },

        document.getElementById("tool")!,

      );



      const submit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Create") as HTMLButtonElement;

      expect(submit.disabled).toBe(true);



      const inputs = document.querySelectorAll(".slex-input") as NodeListOf<HTMLInputElement>;

      inputs[0].value = "Ship template registry";

      inputs[0].dispatchEvent(new InputEvent("input", { bubbles: true }));

      inputs[1].value = "5";

      inputs[1].dispatchEvent(new InputEvent("input", { bubbles: true }));

      (document.querySelector(".slex-checkbox") as HTMLElement)

        .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      await sleep();



      expect(submit.disabled).toBe(false);

      submit.click();



      await expect(handle.promise).resolves.toEqual({

        toolCallId: "call_form",

        toolName: "fill-form",

        status: "submitted",

        value: {

          title: "Ship template registry",

          estimate: 5,

          approved: true,

        },

      });

    });




    it("fill-form supports engineering fields", async () => {

      document.body.innerHTML = '<div id="tool"></div>';



      const handle = renderToolCall(

        {

          id: "call_engineering_form",

          name: "fill-form",

          arguments: {

            title: "Create resistor",

            fields: [

              { name: "resistance", label: "Resistance", type: "engineering", required: true },

            ],

            submitLabel: "Create",

          },

        },

        document.getElementById("tool")!,

      );



      const submit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Create") as HTMLButtonElement;

      expect(submit.disabled).toBe(true);



      const input = document.querySelector(".slex-input") as HTMLInputElement;

      input.value = "bad";

      input.dispatchEvent(new InputEvent("input", { bubbles: true }));

      await sleep();

      expect(submit.disabled).toBe(true);



      input.value = "4.7k";

      input.dispatchEvent(new InputEvent("input", { bubbles: true }));

      await sleep();

      expect(submit.disabled).toBe(false);

      submit.click();



      await expect(handle.promise).resolves.toEqual({

        toolCallId: "call_engineering_form",

        toolName: "fill-form",

        status: "submitted",

        value: {

          resistance: 4700,

        },

      });

    });




    it("ToolHost rejects unknown templates, supports custom registry, and disposes DOM", async () => {

      document.body.innerHTML = '<div id="tool"></div><div id="custom"></div>';



      expect(() =>

        renderToolCall({ name: "missing-template" }, document.getElementById("tool")!),

      ).toThrow("[SlexKit] Unknown tool template: missing-template");



      const customCompiler: ToolTemplateCompiler = (_args, runtime) => ({

        namespace: "custom_tool",

        g: { __slexkitTool: runtime, answer: "ok" },

        layout: {

          "card:tool": {

            title: "Custom",

            "submit:actions": { returnKeys: ["answer"] },

          },

        },

      });

      registerToolTemplate("custom-template", customCompiler);



      const handle = renderToolCall(

        { id: "call_custom", name: "custom-template" },

        document.getElementById("custom")!,

      );

      expect(document.querySelector(".slexkit-root")).toBeTruthy();

      handle.dispose();

      expect(document.getElementById("custom")?.querySelector(".slexkit-root")).toBeFalsy();



      const second = renderToolCall(

        { id: "call_custom_2", name: "custom-template" },

        document.getElementById("custom")!,

      );

      const submit = Array.from(document.querySelectorAll(".slex-button"))

        .find((button) => button.textContent?.trim() === "Submit") as HTMLButtonElement;

      submit.click();



      await expect(second.promise).resolves.toEqual({

        toolCallId: "call_custom_2",

        toolName: "custom-template",

        status: "submitted",

        value: { answer: "ok" },

      });

    });
});
