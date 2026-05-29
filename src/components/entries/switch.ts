import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Switch from "../svelte/input/Switch.svelte";

register("switch", createSvelteRenderer("switch", Switch), { state: "enabled" });

export { Switch };
export default Switch;
