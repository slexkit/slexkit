import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Checkbox from "../svelte/input/Checkbox.svelte";

register("checkbox", createSvelteRenderer("checkbox", Checkbox), { state: "checked" });

export { Checkbox };
export default Checkbox;