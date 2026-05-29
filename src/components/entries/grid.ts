import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Grid from "../svelte/layout/Grid.svelte";

register("grid", createSvelteRenderer("grid", Grid), { state: "none" });

export { Grid };
export default Grid;