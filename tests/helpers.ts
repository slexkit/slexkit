import { defineSlexElements, type SlexElement, type SlexElementType } from "../src/web-components";

export function sleep(ms = 30) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function mountSlexElement(
  type: SlexElementType,
  props: Record<string, unknown> = {},
  children: Node[] = [],
): SlexElement {
  defineSlexElements({ window: window as Window & typeof globalThis, cssText: "" });
  const node = document.createElement(`slex-${type}`) as SlexElement;
  Object.assign(node, props);
  node.append(...children);
  document.body.replaceChildren(node);
  return node;
}

export function clickByText<T extends HTMLElement = HTMLElement>(selector: string, text: string): T {
  const node = Array.from(document.querySelectorAll<T>(selector))
    .find((item) => item.textContent?.includes(text));
  if (!node) throw new Error(`No ${selector} element contains ${text}.`);
  node.click();
  return node;
}
