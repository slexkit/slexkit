<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function colValue(value: unknown, fallback = 1): string {
    const n = Number(value ?? fallback);
    return Number.isFinite(n) ? String(n) : String(fallback);
  }
</script>

<div
  class={`slex-grid${p.class ? ` ${text(p.class)}` : ""}`}
  id={p.id ? text(p.id) : undefined}
  data-cols={colValue(p.columns)}
  data-cols-sm={p.smColumns === undefined ? undefined : colValue(p.smColumns, Number(p.columns ?? 1))}
  data-cols-md={colValue(p.mdColumns, Number(p.columns ?? 1))}
  data-cols-lg={p.lgColumns === undefined ? undefined : colValue(p.lgColumns, Number(p.mdColumns ?? p.columns ?? 1))}
  data-cols-xl={p.xlColumns === undefined ? undefined : colValue(p.xlColumns, Number(p.lgColumns ?? p.mdColumns ?? p.columns ?? 1))}
  style:gap={text(p.gap)}
  use:renderChildren={ctx}
></div>
