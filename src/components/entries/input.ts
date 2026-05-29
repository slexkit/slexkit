import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Input from "../svelte/input/Input.svelte";

register("input", createSvelteRenderer("input", Input), { state: "value" });

export { Input };
export default Input;