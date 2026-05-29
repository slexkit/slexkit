<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let checked = $state(false);
  let lastHapticAt = 0;
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    checked = !!(next.checked ?? next.value);
  }));

  function toggle(event: Event): void {
    if (p.disabled) return;
    checked = (event.target as HTMLInputElement).checked;
    emit(ctx, "change", checked);
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

<span class="slex-choice-event-layer" onpointerdown={() => haptic(8)} onclick={() => haptic(8)}>
  <label class="slex-checkbox-field">
    <input
      type="checkbox"
      class="slex-checkbox"
      bind:checked
      disabled={!!p.disabled}
      data-state={checked ? "checked" : "unchecked"}
      aria-label={text(p["aria-label"] ?? p.ariaLabel ?? p.label) || undefined}
      onchange={toggle}
    />
    <span class="slex-checkbox-label">
      {#if p.icon}<InlineIcon name={p.icon} className="slex-checkbox-icon" />{/if}
      <span>{text(p.label)}</span>
    </span>
  </label>
</span>
