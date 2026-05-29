<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<div class="slex-diagram" data-kind={text(p.kind ?? componentName)}></div>
