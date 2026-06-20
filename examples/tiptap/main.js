import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Mathematics, migrateMathStrings } from "@tiptap/extension-mathematics";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";
import { loadAdapterDemoMarkdown } from "/shared/adapter-demo.js";

const markdown = await loadAdapterDemoMarkdown();
const embed = new URLSearchParams(window.location.search).get("embed") === "1";

if (embed) document.querySelector(".adapter-example-shell")?.setAttribute("data-embed", "true");

const editor = new Editor({
  element: document.querySelector("#editor"),
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Markdown,
    Mathematics,
    createSlexKitTiptapExtension({
      artifactId: "examples-tiptap",
      theme: "host-shadcn",
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
