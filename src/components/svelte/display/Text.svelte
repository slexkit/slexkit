<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<div class={`slex-text${p.variant ? ` slex-text--${text(p.variant)}` : ""}${p.class ? ` ${text(p.class)}` : ""}`}>{text(p.content ?? p.text ?? p.label)}</div>
