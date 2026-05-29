import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Badge from "../svelte/content/Badge.svelte";

register("badge", createSvelteRenderer("badge", Badge), { state: "readable" });

export { Badge };
export default Badge;