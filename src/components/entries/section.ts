import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Section from "../svelte/content/Section.svelte";

register("section", createSvelteRenderer("section", Section), { state: "readable" });

export { Section };
export default Section;