import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Collapsible from "../svelte/disclosure/Collapsible.svelte";

register("collapsible", createSvelteRenderer("collapsible", Collapsible), { state: "none" });

export { Collapsible };
export default Collapsible;