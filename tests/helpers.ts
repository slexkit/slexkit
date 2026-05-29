import { mount } from "../src/engine/index";

export function sleep(ms = 30) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uniqueNamespace(prefix = "test") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function mountDsl(input: Parameters<typeof mount>[0], html = '<div id="app"></div>') {
  document.body.innerHTML = html;
  const container = document.getElementById("app");
  if (!container) throw new Error("mountDsl requires an #app container.");
  return mount(input, container);
}

export function clickByText<T extends HTMLElement = HTMLElement>(selector: string, text: string): T {
  const node = Array.from(document.querySelectorAll<T>(selector))
    .find((item) => item.textContent?.includes(text));
  if (!node) throw new Error(`No ${selector} element contains ${text}.`);
  node.click();
  return node;
}
