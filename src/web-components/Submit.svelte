<script lang="ts">
  import { bindPropStore } from "../components/svelte/bindProps";
  import { text } from "../components/svelte/helpers";
  import type { PropValues, SvelteComponentProps } from "../components/svelte/types";
  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => p = next));
</script>

<div class="slex-submit-bar">
  <button type="button" class="slex-button slex-button--ghost" onclick={() => ctx.emit("ignore")}>{text(p.ignoreLabel, "Ignore")}</button>
  <button type="button" class="slex-button slex-button--primary" disabled={!!p.disabled} onclick={() => ctx.emit("submit")}>{text(p.submitLabel, "Submit")}</button>
</div>
