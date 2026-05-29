import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Accordion from "../svelte/disclosure/Accordion.svelte";

register("accordion", createSvelteRenderer("accordion", Accordion), { state: "none" });

export { Accordion };
export default Accordion;