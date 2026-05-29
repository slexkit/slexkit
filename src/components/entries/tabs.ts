import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Tabs from "../svelte/input/Tabs.svelte";

register("tabs", createSvelteRenderer("tabs", Tabs), { state: "value" });

export { Tabs };
export default Tabs;