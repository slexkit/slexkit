import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import CodeBlock from "../svelte/content/CodeBlock.svelte";

register("code-block", createSvelteRenderer("code-block", CodeBlock), { state: "readable" });

export { CodeBlock };
export default CodeBlock;