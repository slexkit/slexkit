import { register } from "../../engine/registry";
import { createSvelteRenderer } from "../svelte/adapter";
import Toast from "../svelte/feedback/Toast.svelte";

register("toast", createSvelteRenderer("toast", Toast), { state: "none" });

export { Toast };
export default Toast;