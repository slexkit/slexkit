import { register } from "../engine/registry";
import { createSvelteRenderer } from "./svelte/adapter";
import type { ComponentRegistrationOptions } from "../engine/types";
import Playground from "./svelte/tooling/Playground.svelte";

export function registerTooling(options: ComponentRegistrationOptions = {}): void {
  register("playground", createSvelteRenderer("playground", Playground), { state: options.state ?? "none" });
}

registerTooling();
