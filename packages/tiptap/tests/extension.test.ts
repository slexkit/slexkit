import { afterEach, describe, expect, it, mock } from "bun:test";
import { Editor, type JSONContent } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { readFileSync } from "node:fs";
import { createSlexKitTiptapExtension } from "../src/index";

const editors: Editor[] = [];
const roots: HTMLElement[] = [];

function slexSource(namespace: string, text: string): string {
  return `{
  slex: "0.1",
  namespace: "${namespace}",
  layout: {
    "text:message": { text: "${text}" }
  }
}`;
}

function slexSliderSource(namespace: string): string {
  return `{
  slex: "0.1",
  namespace: "${namespace}",
  layout: {
    "slider:gain": { value: 50, min: 0, max: 100, step: 1, onchange: "g.gain = $event" }
  }
}`;
}

function slexInputSource(namespace: string): string {
  return `{
  slex: "0.1",
  namespace: "${namespace}",
  layout: {
    "input:name": { type: "text", value: "editable", onchange: "g.name = $event" }
  }
}`;
}

function slexSelectSource(namespace: string): string {
  return `{
  slex: "0.1",
  namespace: "${namespace}",
  layout: {
    "select:mode": {
      value: "a",
      options: [
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" }
      ],
      onchange: "g.mode = $event"
    }
  }
}`;
}

function slexInteractiveMatrixSource(namespace: string): string {
  return `{
  slex: "0.1",
  namespace: "${namespace}",
  layout: {
    "button:plain": { label: "Button", onclick: "g.clicked = true" },
    "button:linkButton": { label: "Link Button", href: "#link-button" },
    "link:inline": { text: "Inline link", href: "#inline-link" },
    "submit:actions": { submitLabel: "Submit", ignoreLabel: "Ignore" },
    "checkbox:agree": { label: "Agree", checked: false },
    "switch:enabled": { label: "Enabled", enabled: false },
    "radio-group:radioMode": {
      value: "a",
      options: [
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" }
      ]
    },
    "slider:gain": { value: 50, min: 0, max: 100, step: 1, onchange: "g.gain = $event" },
    "select:selectMode": {
      value: "a",
      options: [
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" }
      ],
      onchange: "g.mode = $event"
    },
    "tabs:view": {
      value: "one",
      tabs: [
        { label: "One", value: "one", content: "One panel" },
        { label: "Two", value: "two", content: "Two panel" }
      ],
      onchange: "g.view = $event"
    },
    "accordion:faq": {
      items: [
        { label: "Question", value: "q", content: "Answer" }
      ],
      onchange: "g.faq = $event"
    },
    "collapsible:more": { trigger: "More", content: "Details", onchange: "g.more = $event" },
    "input:name": { type: "text", value: "editable", onchange: "g.name = $event" }
  }
}`;
}

function codeBlock(language: string, text: string): JSONContent {
  return {
    type: "codeBlock",
    attrs: { language },
    content: [{ type: "text", text }],
  };
}

function doc(...content: JSONContent[]): JSONContent {
  return { type: "doc", content };
}

function createEditor(content: JSONContent | string, options: Parameters<typeof createSlexKitTiptapExtension>[0] = {}, markdown = false): Editor {
  const element = document.createElement("div");
  document.body.appendChild(element);
  roots.push(element);

  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      ...(markdown ? [Markdown] : []),
      createSlexKitTiptapExtension(options),
    ],
    content,
    ...(markdown ? { contentType: "markdown" as const } : {}),
  });

  editors.push(editor);
  return editor;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function flushFocusRestore(): Promise<void> {
  await flush();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 60));
}

async function pointerClick(element: HTMLElement): Promise<void> {
  element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  await flushFocusRestore();
}

afterEach(() => {
  for (const editor of editors.splice(0)) {
    editor.destroy();
  }
  for (const root of roots.splice(0)) {
    root.remove();
  }
  document.body.innerHTML = "";
});

describe("SlexKit Tiptap extension", () => {
  it("renders slex code blocks as SlexKit previews", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSource("tiptap_render", "Rendered"))));
    await flush();

    expect(editor.view.dom.querySelector(".slex-tiptap-block")).toBeTruthy();
    expect(editor.view.dom.querySelector(".slex-tiptap-preview")?.getAttribute("contenteditable")).toBe("false");
    expect(editor.view.dom.querySelector(".slexkit-root")).toBeTruthy();
    expect(editor.view.dom.textContent).toContain("Rendered");
    expect(editor.view.dom.querySelector(".slex-tiptap-source")).toBeTruthy();
  });

  it("keeps ordinary code blocks out of SlexKit rendering", async () => {
    const editor = createEditor(doc(codeBlock("js", "const value = 1;")));
    await flush();

    expect(editor.view.dom.querySelector(".slexkit-root")).toBeNull();
    expect(editor.view.dom.querySelector("pre.slex-tiptap-code-block code.language-js")).toBeTruthy();
    expect(editor.view.dom.textContent).toContain("const value = 1;");
  });

  it("lets state-only fences seed later layout fences in the same editor artifact", async () => {
    const editor = createEditor(doc(
      codeBlock("slex", `{
  namespace: "shared",
  g: { value: 21 }
}`),
      codeBlock("slex", `{
  namespace: "shared",
  layout: {
    "text:answer": { "$text": "'answer:' + (g.value * 2)" }
  }
}`),
    ));
    await flush();

    expect(editor.view.dom.querySelector(".slex-tiptap-state")?.textContent).toBe("State block");
    expect(editor.view.dom.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(editor.view.dom.textContent).toContain("answer:42");
  });

  it("clears state seeded by removed state-only fences", async () => {
    const layout = codeBlock("slex", `{
  namespace: "shared_remove",
  layout: {
    "text:answer": { "$text": "'answer:' + String(g.value)" }
  }
}`);
    const editor = createEditor(doc(
      codeBlock("slex", `{
  namespace: "shared_remove",
  g: { value: 21 }
}`),
      layout,
    ));
    await flush();

    expect(editor.view.dom.textContent).toContain("answer:21");

    editor.commands.setContent(doc(layout));
    await flush();

    expect(editor.view.dom.textContent).not.toContain("answer:21");
    expect(editor.view.dom.textContent).toContain("answer:undefined");
  });

  it("keeps matching namespaces isolated across editor artifacts", async () => {
    const content = (value: number) => doc(
      codeBlock("slex", `{
  namespace: "shared",
  g: { value: ${value} }
}`),
      codeBlock("slex", `{
  namespace: "shared",
  layout: { "text:value": { "$text": "'value:' + g.value" } }
}`),
    );

    const first = createEditor(content(1));
    const second = createEditor(content(2));
    await flush();

    expect(first.view.dom.textContent).toContain("value:1");
    expect(first.view.dom.textContent).not.toContain("value:2");
    expect(second.view.dom.textContent).toContain("value:2");
    expect(second.view.dom.textContent).not.toContain("value:1");
  });

  it("cleans up and remounts when source changes", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSource("tiptap_update", "Before"))));
    await flush();

    editor.commands.setContent(doc(codeBlock("slex", slexSource("tiptap_update", "After"))));
    await flush();

    expect(editor.view.dom.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(editor.view.dom.textContent).not.toContain("Before");
    expect(editor.view.dom.textContent).toContain("After");
  });

  it("cleans up mounted SlexKit roots on editor destroy", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSource("tiptap_destroy", "Temporary"))));
    await flush();

    expect(document.querySelector(".slexkit-root")).toBeTruthy();
    editor.destroy();
    await flush();

    expect(document.querySelector(".slexkit-root")).toBeNull();
  });

  it("reports invalid source and keeps source visible", async () => {
    const onError = mock();
    const editor = createEditor(doc(codeBlock("slex", `{
  namespace: "broken",
  layout: { "text:bad": { text:: "Broken" } }
}`)), { onError });
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(editor.view.dom.querySelector(".slex-tiptap-error[role='alert']")).toBeTruthy();
    expect(editor.view.dom.textContent).toContain("Failed to render SlexKit");
    expect(editor.view.dom.querySelector(".slex-tiptap-source")).toBeTruthy();
  });

  it("can hide the source details", async () => {
    const editor = createEditor(
      doc(codeBlock("slex", slexSource("tiptap_hidden_source", "Rendered"))),
      { showSource: false },
    );
    await flush();

    expect(editor.view.dom.querySelector(".slexkit-root")).toBeTruthy();
    expect(editor.view.dom.querySelector(".slex-tiptap-source:not(.slex-tiptap-source-hidden)")).toBeNull();
    expect(editor.view.dom.querySelector(".slex-tiptap-source-hidden")).toBeTruthy();
  });

  it("hides state-only fences when the source is hidden", async () => {
    const editor = createEditor(doc(
      codeBlock("slex", `{
  namespace: "hidden_state",
  g: { value: 21 }
}`),
      codeBlock("slex", `{
  namespace: "hidden_state",
  layout: { "text:value": { "$text": "'value:' + g.value" } }
}`),
    ), { showSource: false });
    await flush();

    const blocks = [...editor.view.dom.querySelectorAll<HTMLElement>(".slex-tiptap-block")];
    expect(blocks).toHaveLength(2);
    expect(blocks[0].hidden).toBe(true);
    expect(blocks[0].querySelector(".slex-tiptap-state")).toBeNull();
    expect(blocks[1].hidden).toBe(false);
    expect(editor.view.dom.textContent).toContain("value:21");
  });

  it("keeps hidden adapter chrome hidden in the shipped stylesheet", () => {
    const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");

    expect(css).toContain(".slex-tiptap-block[hidden]");
    expect(css).toContain(".slex-tiptap-source[hidden]");
    expect(css).toContain("display: none;");
  });

  it("preserves slex fences through Tiptap markdown roundtrip", async () => {
    const markdown = `Text before.

\`\`\`slex
${slexSource("roundtrip", "Markdown")}
\`\`\`

Fallback text.

\`\`\`js
const ordinary = true;
\`\`\`
`;
    const editor = createEditor(markdown, { artifactId: "roundtrip-doc" }, true);
    await flush();

    expect(editor.view.dom.querySelector(".slexkit-root")).toBeTruthy();
    const getMarkdown = (editor as unknown as { getMarkdown?: () => string }).getMarkdown;
    expect(typeof getMarkdown).toBe("function");
    const output = getMarkdown.call(editor);

    expect(output).toContain("```slex");
    expect(output).toContain('namespace: "roundtrip"');
    expect(output).toContain("Fallback text.");
    expect(output).toContain("```js");
    expect(output.indexOf("```slex")).toBeLessThan(output.indexOf("```js"));
  });

  it("restores editor focus after pointer interaction with transient preview controls", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSliderSource("tiptap_focus_slider"))));
    await flush();

    const slider = editor.view.dom.querySelector<HTMLInputElement>(".slex-tiptap-preview input[type='range']");
    expect(slider).toBeTruthy();

    slider?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(document.activeElement).toBe(slider);

    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await flushFocusRestore();

    expect(document.activeElement).not.toBe(slider);
  });

  it("keeps focus inside text inputs embedded in the preview", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexInputSource("tiptap_focus_input"))));
    await flush();

    const input = editor.view.dom.querySelector<HTMLInputElement>(".slex-tiptap-preview input[type='text']");
    expect(input).toBeTruthy();

    input?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(document.activeElement).toBe(input);

    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await flushFocusRestore();

    expect(document.activeElement).toBe(input);
  });

  it("clears delayed focus returned by select triggers in the preview", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSelectSource("tiptap_focus_select"))));
    await flush();

    const trigger = editor.view.dom.querySelector<HTMLButtonElement>(".slex-tiptap-preview .slex-select-trigger");
    expect(trigger).toBeTruthy();

    trigger?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    trigger?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await flushFocusRestore();

    const option = editor.view.dom.querySelector<HTMLElement>(".slex-tiptap-preview .slex-select-option:not(.slex-select-option--selected)");
    expect(option).toBeTruthy();

    option?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    option?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushFocusRestore();

    expect(document.activeElement).not.toBe(trigger);
  });

  it("clears pointer focus for all transient SlexKit preview controls", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexInteractiveMatrixSource("tiptap_focus_matrix"))));
    await flush();

    const preview = editor.view.dom.querySelector<HTMLElement>(".slex-tiptap-preview");
    expect(preview).toBeTruthy();

    const transientTargets = [
      ...preview!.querySelectorAll<HTMLElement>("button.slex-button"),
      ...preview!.querySelectorAll<HTMLElement>("a.slex-button"),
      ...preview!.querySelectorAll<HTMLElement>("a.slex-link"),
      ...preview!.querySelectorAll<HTMLElement>("input.slex-checkbox"),
      ...preview!.querySelectorAll<HTMLElement>("input.slex-switch-input"),
      ...preview!.querySelectorAll<HTMLElement>("input.slex-radio"),
      ...preview!.querySelectorAll<HTMLElement>("input.slex-slider"),
      ...preview!.querySelectorAll<HTMLElement>(".slex-tabs-trigger"),
      ...preview!.querySelectorAll<HTMLElement>(".slex-accordion-trigger"),
      ...preview!.querySelectorAll<HTMLElement>(".slex-collapsible-trigger"),
    ];

    expect(transientTargets.length).toBeGreaterThanOrEqual(12);

    for (const target of transientTargets) {
      const label = `${target.tagName.toLowerCase()}.${String(target.className)}:${target.textContent?.trim()}`;
      await pointerClick(target);
      expect(document.activeElement, label).not.toBe(target);
    }

    const selectTrigger = editor.view.dom.querySelector<HTMLButtonElement>(".slex-tiptap-preview .slex-select-trigger");
    expect(selectTrigger).toBeTruthy();
    await pointerClick(selectTrigger!);

    const option = editor.view.dom.querySelector<HTMLElement>(".slex-tiptap-preview .slex-select-option:not(.slex-select-option--selected)");
    expect(option).toBeTruthy();
    await pointerClick(option!);
    expect(document.activeElement).not.toBe(selectTrigger);

    const input = editor.view.dom.querySelector<HTMLInputElement>(".slex-tiptap-preview input[type='text']");
    expect(input).toBeTruthy();
    input?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await flushFocusRestore();

    expect(document.activeElement).toBe(input);
  });

  it("keeps keyboard focus on preview controls", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexInteractiveMatrixSource("tiptap_keyboard_focus_matrix"))));
    await flush();

    const keyboardTargets = [
      editor.view.dom.querySelector<HTMLElement>(".slex-tiptap-preview button.slex-button"),
      editor.view.dom.querySelector<HTMLElement>(".slex-tiptap-preview input.slex-slider"),
      editor.view.dom.querySelector<HTMLElement>(".slex-tiptap-preview .slex-tabs-trigger"),
    ];

    for (const target of keyboardTargets) {
      expect(target).toBeTruthy();
      target?.focus();
      await flushFocusRestore();

      expect(document.activeElement).toBe(target);
    }
  });
});
