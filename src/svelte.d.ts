declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component<Record<string, unknown>>;
  export default component;
}

declare module "*.svg?raw" {
  const source: string;
  export default source;
}
