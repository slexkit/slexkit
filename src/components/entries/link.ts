import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Link from "../svelte/content/Link.svelte";

register("link", createSvelteRenderer("link", Link), { state: "readable" });

export { Link };
export default Link;