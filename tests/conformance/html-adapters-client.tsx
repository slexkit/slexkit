import * as runtime from "../../dist/slexkit.js";
import { defineSlexPlayground } from "../../dist/tooling.js";
import { htmlCalculator, htmlLayoutCompatibility } from "./html-fixtures";
import React from "react";
import { createRoot } from "react-dom/client";
import { createSlexKitRenderer } from "../../packages/streamdown/dist/index.js";
import { createSlexKitAssistantStreamdownComponents } from "../../packages/assistant-ui/dist/index.js";
import { createSlexKitTiptapExtension } from "../../packages/tiptap/dist/index.js";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

const root = document.querySelector<HTMLElement>("#app")!;
const errors: string[] = [];
window.addEventListener("error", event => errors.push(event.message));
let dispose = () => {};
let apply: (source: string, phase?: "preview" | "commit", reset?: boolean) => Promise<void>;
let current = htmlCalculator;
let host: ReturnType<typeof runtime.createSlexKitMarkdownRuntimeHost>;
const options = () => ({ secureFrame: { runtimeUrl: `${location.origin}/dist/slexkit.js`, styleUrl: `${location.origin}/dist/slexkit.css` } });
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 50));

async function start(route: string, source = htmlCalculator) {
  dispose(); root.replaceChildren(); errors.length = 0; current = source;
  host = runtime.createSlexKitMarkdownRuntimeHost(options());
  if (route === "web") {
    const slot = document.createElement("section"); root.append(slot);
    apply = async (source, phase = "commit", reset = false) => {
      await host.updateArtifact("fixture", [{ blockId: "calculator", source, container: slot }], { phase, reset });
      if (phase === "commit") current = source;
    };
    dispose = () => host.disposeAll();
  } else if (route === "playground") {
    defineSlexPlayground(window as Window & typeof globalThis, options());
    const playground = document.createElement("slex-playground") as HTMLElement & { source: string };
    playground.setAttribute("autorun", ""); playground.source = current; root.append(playground);
    apply = async (source, phase = "commit") => {
      playground.source = source;
      if (phase === "commit") playground.shadowRoot!.querySelector<HTMLButtonElement>("[data-run]")!.click();
      await tick(); if (phase === "commit") current = source;
    };
    dispose = () => { playground.remove(); host.disposeAll(); };
  } else if (route === "tiptap") {
    const editor = new Editor({ element: root, extensions: [StarterKit.configure({ codeBlock: false }), createSlexKitTiptapExtension({ artifactId: "fixture", runtimeHost: host, showSource: false })],
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Ordinary Markdown stays editable." }] }, { type: "codeBlock", attrs: { language: "slex" }, content: [{ type: "text", text: current }] }] } });
    apply = async (source, phase = "commit", reset = false) => {
      if (phase === "preview") return;
      let position = -1; let size = 0;
      editor.state.doc.descendants((node, pos) => { if (node.type.name === "codeBlock") { position = pos + 1; size = node.content.size; } });
      if (position < 0) throw new Error("Missing Tiptap source node");
      editor.view.dispatch(editor.state.tr.insertText(source, position, position + size));
      current = source; await tick(); if (reset) await host.resetArtifact("fixture");
    };
    dispose = () => { editor.destroy(); host.disposeAll(); };
  } else {
    const react = createRoot(root);
    const renderer = createSlexKitRenderer({ domain: "fixture", runtimeHost: host, showChrome: false });
    const Assistant = createSlexKitAssistantStreamdownComponents({ artifactId: "fixture", runtimeHost: host }).slex.SyntaxHighlighter;
    apply = async (source, phase = "commit", reset = false) => {
      react.render(route === "assistant-ui"
        ? React.createElement(Assistant, { code: source, language: "slex", status: { type: phase === "preview" ? "running" : "complete" } })
        : React.createElement(renderer.component, { code: source, language: "slex", isIncomplete: phase === "preview" }));
      await tick(); if (phase === "commit") current = source; if (reset) await host.resetArtifact("fixture");
    };
    dispose = () => { react.unmount(); host.disposeAll(); };
  }
  if (!["tiptap", "playground"].includes(route)) await apply(current);
  await tick();
}

Object.assign(window, { harness: { start, errors, layoutSource: htmlLayoutCompatibility, get source() { return current; },
  update: (source: string, phase: "preview" | "commit" = "commit", reset = false) => apply(source, phase, reset),
  reset: () => host.resetArtifact("fixture"),
  dispose: () => dispose(),
} });
