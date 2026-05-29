import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Text from "../svelte/display/Text.svelte";

register("text", createSvelteRenderer("text", Text), { state: "readable" });

export { Text };
export default Text;