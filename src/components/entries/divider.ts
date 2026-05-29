import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Divider from "../svelte/content/Divider.svelte";

register("divider", createSvelteRenderer("divider", Divider), { state: "readable" });

export { Divider };
export default Divider;