import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Submit from "../svelte/input/Submit.svelte";

register("submit", createSvelteRenderer("submit", Submit), { state: "none" });

export { Submit };
export default Submit;