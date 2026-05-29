<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, label, renderChildren, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let open = $state(false);
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    open = !!(next.open ?? next.value);
  }));

  function toggle(): void {
    open = !open;
    emit(ctx, open ? "open" : "close", open);
    emit(ctx, "change", open);
  }
</script>

<div class="slex-collapsible" data-state={open ? "open" : "closed"}>
  <button
    type="button"
    class="slex-collapsible-trigger"
    data-state={open ? "open" : "closed"}
    aria-expanded={open}
    aria-controls={`${ctx.id}-content`}
    onclick={toggle}
  >
    <span class="slex-collapsible-label">
      {#if p.icon}<InlineIcon name={p.icon} selected={open} className="slex-collapsible-icon" />{/if}
      <span>{label(ctx, "collapsible.trigger", p.trigger, "Toggle")}</span>
    </span>
    <span class="slex-collapsible-indicator" aria-hidden="true"></span>
  </button>
  <div
    id={`${ctx.id}-content`}
    class="slex-collapsible-content"
    data-state={open ? "open" : "closed"}
    aria-hidden={!open}
  >
    <div class="slex-collapsible-content-inner" use:renderChildren={ctx}>{text(p.content)}</div>
  </div>
</div>
