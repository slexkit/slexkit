import type { Component } from "svelte";
import type { RenderContext } from "../../src/engine/types";

export type PropValues = Record<string, unknown>;

export type PropStore = {
  subscribe(run: (value: PropValues) => void): () => void;
};

export type SvelteComponentProps = {
  componentName: string;
  ctx: RenderContext;
  props: PropStore;
};

export type SiteSvelteComponent = Component<SvelteComponentProps>;
