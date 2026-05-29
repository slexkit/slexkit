import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Card from "../svelte/layout/Card.svelte";

register("card", createSvelteRenderer("card", Card), { state: "none" });

export { Card };
export default Card;