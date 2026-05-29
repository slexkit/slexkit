import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Select from "../svelte/input/Select.svelte";

register("select", createSvelteRenderer("select", Select), { state: "value" });

export { Select };
export default Select;