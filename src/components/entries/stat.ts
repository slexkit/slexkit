import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Stat from "../svelte/display/Stat.svelte";

register("stat", createSvelteRenderer("stat", Stat), { state: "readable" });

export { Stat };
export default Stat;