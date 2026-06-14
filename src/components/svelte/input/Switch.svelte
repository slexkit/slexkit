<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let enabled = $state(false);
  let lastHapticAt = 0;
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    enabled = !!(next.enabled ?? next.checked ?? next.value);
  }));

  function toggle(event: Event): void {
    if (p.disabled) return;
    enabled = (event.target as HTMLInputElement).checked;
    emit(ctx, "change", enabled);
  }

  function vibrate(duration = 8): void {
    if (p.haptic === false || p.haptics === false || p.disabled) return;
    const api = globalThis.navigator as (Navigator & { vibrate?: (pattern: number | number[]) => boolean }) | undefined;
    api?.vibrate?.(duration);
  }

  function haptic(duration = 8): void {
    const now = Date.now();
    if (now - lastHapticAt < 80) return;
    lastHapticAt = now;
    vibrate(duration);
  }
</script>

<span class="slex-switch-event-layer" onpointerdown={() => haptic(8)} onclick={() => haptic(8)}>
  <label class="slex-switch" data-state={enabled ? "on" : "off"}>
    <input
      type="checkbox"
      role="switch"
      class="slex-switch-input"
      bind:checked={enabled}
      disabled={!!p.disabled}
      aria-label={text(p["aria-label"] ?? p.ariaLabel ?? p.label) || undefined}
      onchange={toggle}
    />
    <span class="slex-switch-control" aria-hidden="true"></span>
    <span class="slex-switch-label">
      {#if p.icon}<InlineIcon name={p.icon} className="slex-switch-icon" />{/if}
      <span>{text(p.label)}</span>
    </span>
  </label>
</span>
