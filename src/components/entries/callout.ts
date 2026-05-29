import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Callout from "../svelte/content/Callout.svelte";

register("callout", createSvelteRenderer("callout", Callout), { state: "readable" });

export { Callout };
export default Callout;