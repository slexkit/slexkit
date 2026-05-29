import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Slider from "../svelte/input/Slider.svelte";

register("slider", createSvelteRenderer("slider", Slider), { state: "value" });

export { Slider };
export default Slider;