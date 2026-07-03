<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, list, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let value = $state<unknown>(undefined);
  const lastHapticAt = new Map<string, number>();
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    value = next.value;
  }));

  function choose(next: unknown): void {
    value = next;
    emit(ctx, "change", next);
  }

  function vibrate(disabled: boolean, duration = 8): void {
    if (disabled || p.haptic === false || p.haptics === false) return;
    const api = globalThis.navigator as (Navigator & {
      userActivation?: { isActive?: boolean };
      vibrate?: (pattern: number | number[]) => boolean;
    }) | undefined;
    if (api?.userActivation?.isActive === false) return;
    api?.vibrate?.(duration);
  }

  function haptic(key: string, disabled: boolean, duration = 8): void {
    const now = Date.now();
    if (now - (lastHapticAt.get(key) ?? 0) < 80) return;
    lastHapticAt.set(key, now);
    vibrate(disabled, duration);
  }

  function groupName(): string {
    return text(p.name ?? ctx.id, ctx.id);
  }
</script>

<div
  class="slex-radio-group"
  data-scope="radio-group"
  data-part="root"
  data-orientation={text(p.orientation, "vertical")}
  data-variant={text(p.variant ?? p.presentation) || undefined}
  role="radiogroup"
  aria-label={text(p["aria-label"] ?? p.ariaLabel ?? p.label) || undefined}
>
  {#if p.label || p.icon}
    <div class="slex-radio-group-label">
      {#if p.icon}<InlineIcon name={p.icon} className="slex-radio-group-icon" />{/if}
      {#if p.label}<span>{text(p.label)}</span>{/if}
    </div>
  {/if}
  <div class="slex-radio-group-list">
  {#each list(p.options) as item}
    {@const itemValue = item.value ?? item.label}
    {@const disabled = !!item.disabled || !!p.disabled}
    {@const hapticKey = text(itemValue)}
    <span class="slex-choice-event-layer" onpointerdown={() => haptic(hapticKey, disabled, 8)} onclick={() => haptic(hapticKey, disabled, 8)}>
      <label
        class="slex-radio-field"
        data-disabled={disabled ? "true" : undefined}
        data-state={itemValue === value ? "checked" : "unchecked"}
      >
        <input
          type="radio"
          class="slex-radio"
          name={groupName()}
          value={text(itemValue)}
          checked={itemValue === value}
          disabled={disabled}
          data-state={itemValue === value ? "checked" : "unchecked"}
          onchange={() => choose(itemValue)}
        />
        <span class="slex-radio-label">
          {#if item.icon}<InlineIcon name={item.icon} selected={itemValue === value} className="slex-radio-icon" />{/if}
          <span class="slex-radio-label-text">
            <span>{text(item.label)}</span>
            {#if item.description}
              <small>{text(item.description)}</small>
            {/if}
          </span>
        </span>
      </label>
    </span>
  {/each}
  </div>
</div>
