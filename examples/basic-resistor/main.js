import { mount } from "/dist/slexkit.js";

const source = await fetch("./source.slex.js").then((response) => response.text());
mount(source, document.getElementById("app"), { theme: "host-shadcn" });
