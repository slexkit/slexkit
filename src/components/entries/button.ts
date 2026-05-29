import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Button from "../svelte/input/Button.svelte";

register("button", createSvelteRenderer("button", Button), { state: "none" });

export { Button };
export default Button;