<script lang="ts">
  import katex from "katex";
  import { bindPropStore } from "../bindProps";
  import { bool, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  const tex = $derived(text(p.tex ?? p.formula ?? p.value));
  const displayMode = $derived(p.displayMode === undefined && p.display === undefined && p.block === undefined
    ? true
    : bool(p.displayMode ?? p.display ?? p.block));
  const rendered = $derived(renderFormula(tex, displayMode));

  function renderFormula(source: string, display: boolean): string {
    return katex.renderToString(source || "\\,", {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      output: "htmlAndMathml",
    });
  }
</script>

<div class="slex-formula" data-display={displayMode ? "block" : "inline"}>{@html rendered}</div>
