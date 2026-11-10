import { mount } from "/dist/slexkit.js";

const source = await fetch("./source.slex.html").then((response) => response.text());
const handle = mount(source, document.getElementById("app"), {
  secureFrame: { runtimeUrl: "/slexkit.runtime.js", styleUrl: "/dist/slexkit.css" },
});
await handle.ready;
