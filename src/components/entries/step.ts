import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Step from "../svelte/input/Step.svelte";

register("step", createSvelteRenderer("step", Step), { state: "none" });
