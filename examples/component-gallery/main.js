import { mount } from "/dist/slexkit.js";
import { componentGallerySource } from "./source.js";

const handle = mount(componentGallerySource, document.getElementById("app"), { secureFrame: { runtimeUrl: "/slexkit.runtime.js", styleUrl: "/dist/slexkit.css", fontUrls: [new URL("/dist/fonts/", location.href).href] } });
await handle.ready;
