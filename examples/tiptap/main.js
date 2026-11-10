import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Mathematics, migrateMathStrings } from "@tiptap/extension-mathematics";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import { loadAdapterDemoMarkdown } from "/shared/adapter-demo.js";

const markdown = await loadAdapterDemoMarkdown();
const embed = new URLSearchParams(window.location.search).get("embed") === "1";
const runtimeHost = createSlexKitMarkdownRuntimeHost({
  secureFrame: {
    runtimeUrl: new URL("../../slexkit.runtime.js", import.meta.url).href,
    styleUrl: new URL("../../slexkit.css", import.meta.url).href,
    fontUrls: [new URL("../../fonts/", import.meta.url).href],
  },
});

if (embed) document.querySelector(".adapter-example-shell")?.setAttribute("data-embed", "true");

const editor = new Editor({
  element: document.querySelector("#editor"),
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Markdown,
    Mathematics,
    createSlexKitTiptapExtension({
      artifactId: "examples-tiptap",
      runtimeHost,
    }),
  ],
  content: markdown,
  contentType: "markdown",
  onCreate({ editor: currentEditor }) {
    migrateMathStrings(currentEditor);
  },
});

const output = document.querySelector("#markdown-output");

function renderMarkdown() {
  output.textContent = editor.getMarkdown();
}

editor.on("update", renderMarkdown);
renderMarkdown();

window.slexkitTiptapExample = { editor };
window.addEventListener("pagehide", () => { editor.destroy(); runtimeHost.disposeAll(); }, { once: true });
