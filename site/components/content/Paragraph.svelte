<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<p class="slex-paragraph" data-tone={p.tone === "lead" ? "lead" : "body"}>{text(p.text ?? p.content ?? p.label)}</p>
