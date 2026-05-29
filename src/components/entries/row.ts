import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Row from "../svelte/layout/Row.svelte";

register("row", createSvelteRenderer("row", Row), { state: "none" });

export { Row };
export default Row;