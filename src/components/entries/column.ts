import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Column from "../svelte/layout/Column.svelte";

register("column", createSvelteRenderer("column", Column), { state: "none" });

export { Column };
export default Column;