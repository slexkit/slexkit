import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Progress from "../svelte/feedback/Progress.svelte";

register("progress", createSvelteRenderer("progress", Progress), { state: "readable" });

export { Progress };
export default Progress;