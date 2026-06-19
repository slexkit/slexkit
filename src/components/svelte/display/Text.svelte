<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  const color = $derived(p.color == null || p.color === "" ? undefined : text(p.color));
  const size = $derived(cssLength(p.size));

  function cssLength(value: unknown): string | undefined {
    if (value == null || value === "") return undefined;
    const rendered = text(value);
    return /^-?\d+(\.\d+)?$/.test(rendered) ? `${rendered}px` : rendered;
  }
</script>

<div
  class={`slex-text${p.variant ? ` slex-text--${text(p.variant)}` : ""}${p.class ? ` ${text(p.class)}` : ""}`}
  style:color={color}
  style:font-size={size}
>{text(p.content ?? p.text ?? p.label)}</div>
