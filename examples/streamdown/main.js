import React from "react";
import { createRoot } from "react-dom/client";
import { Streamdown } from "streamdown";
import { createMathPlugin } from "@streamdown/math";
import { createSlexKitRenderer } from "@slexkit/streamdown";
import { loadAdapterDemoMarkdown } from "/shared/adapter-demo.js";

const markdown = await loadAdapterDemoMarkdown();
const embed = new URLSearchParams(window.location.search).get("embed") === "1";
const math = createMathPlugin({
  singleDollarTextMath: true,
});

const renderer = createSlexKitRenderer({
  domain: "examples-streamdown",
  showChrome: false,
});

document.getElementById("markdown-source").textContent = markdown;
if (embed) document.querySelector(".adapter-example-shell")?.setAttribute("data-embed", "true");

createRoot(document.getElementById("streamdown-root")).render(
  React.createElement(
    Streamdown,
    {
      mode: "static",
      controls: {
        code: { copy: false, download: false },
        table: { copy: false, download: false, fullscreen: false },
      },
      plugins: {
        math,
        renderers: [renderer],
      },
    },
    markdown,
  ),
);
