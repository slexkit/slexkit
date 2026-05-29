<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<div
  class={`slex-column${p.class ? ` ${text(p.class)}` : ""}`}
  id={p.id ? text(p.id) : undefined}
  use:renderChildren={ctx}
></div>
