import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import RadioGroup from "../svelte/input/RadioGroup.svelte";

register("radio-group", createSvelteRenderer("radio-group", RadioGroup), { state: "value" });

export { RadioGroup };
export default RadioGroup;