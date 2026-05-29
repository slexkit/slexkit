<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let value = $state<unknown>(0);
  let lastHapticTick = $state<number | null>(null);
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    value = next.value ?? 0;
  }));

  function choose(next: number): void {
    value = next;
    vibrateStep(next);
    emit(ctx, "change", next);
  }

  function numberProp(input: unknown, fallback: number): number {
    const next = Number(input ?? fallback);
    return Number.isFinite(next) ? next : fallback;
  }

  function sliderProgress(current: unknown, min: unknown, max: unknown): string {
    const low = numberProp(min, 0);
    const high = numberProp(max, 100);
    const next = numberProp(current, low);
    if (high <= low) return "0%";

    const ratio = Math.min(1, Math.max(0, (next - low) / (high - low)));
    return `${Math.round(ratio * 10000) / 100}%`;
  }

  function stepSize(): number {
    const step = numberProp(p.step, 1);
    return step > 0 ? step : 1;
  }

  function tickCount(): number {
    const low = numberProp(p.min, 0);
    const high = numberProp(p.max, 100);
    if (high <= low) return 0;
    return Math.round((high - low) / stepSize());
  }

  function tickIndex(current: unknown): number {
    const low = numberProp(p.min, 0);
    return Math.round((numberProp(current, low) - low) / stepSize());
  }

  function vibrate(duration = 8): void {
    if (p.haptic === false || p.haptics === false) return;
    const api = globalThis.navigator as (Navigator & { vibrate?: (pattern: number | number[]) => boolean }) | undefined;
    api?.vibrate?.(duration);
  }

  function grabSlider(): void {
    lastHapticTick = tickIndex(value);
    vibrate(8);
  }

  function vibrateStep(next: number): void {
    if (tickCount() > 20) return;
    const tick = tickIndex(next);
    if (tick === lastHapticTick) return;

    lastHapticTick = tick;
    vibrate(5);
  }
</script>

<div class="slex-slider-field" data-orientation={text(p.orientation, "horizontal")}>
  <div class="slex-slider-label">
    <span class="slex-slider-label-text">
      {#if p.icon}<InlineIcon name={p.icon} className="slex-slider-icon" />{/if}
      <span>{text(p.label ?? componentName)}</span>
    </span>
    <span class="slex-slider-value">{text(value ?? 0)}{#if p.unit} {text(p.unit)}{/if}</span>
  </div>
  <input
    type="range"
    class="slex-slider"
    min={Number(p.min ?? 0)}
    max={Number(p.max ?? 100)}
    step={Number(p.step ?? 1)}
    value={Number(value ?? 0)}
    disabled={!!p.disabled}
    aria-label={text(p["aria-label"] ?? p.ariaLabel ?? p.label ?? componentName)}
    style={`--slex-slider-progress: ${sliderProgress(value, p.min, p.max)}`}
    onpointerdown={grabSlider}
    oninput={(event) => choose(Number((event.target as HTMLInputElement).value))}
  />
</div>
