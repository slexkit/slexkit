import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Table from "../svelte/content/Table.svelte";

register("table", createSvelteRenderer("table", Table), { state: "readable" });

export { Table };
export default Table;