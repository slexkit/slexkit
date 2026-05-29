<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function tone(): string {
    const raw = text(p.tone ?? p.type ?? p.variant, "neutral").toLowerCase();
    if (raw === "danger" || raw === "error") return "destructive";
    if (raw === "muted" || raw === "neutral" || raw === "default") return "neutral";
    return raw;
  }
</script>

<span class="slex-badge" data-tone={tone()}>{#if p.icon}<InlineIcon name={p.icon} className="slex-badge-icon" />{/if}<span class="slex-badge-label">{text(p.label ?? p.text ?? p.content ?? componentName)}</span></span>
