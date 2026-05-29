<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<main
  class={`slex-page${p.variant ? ` slex-page--${text(p.variant)}` : ""}${p.class ? ` ${text(p.class)}` : ""}`}
  data-density={p.density === "compact" ? "compact" : "normal"}
  style:max-width={text(p.maxWidth, "1180px")}
  style:padding-top={text(p.paddingY, "3rem")}
  style:padding-bottom={text(p.paddingY, "3rem")}
  use:renderChildren={ctx}
></main>
