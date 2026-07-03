<script lang="ts">
  import { getIcon, iconCacheKey, loadIcon } from "../../icons/manager";
  import type { IconState, IconWeight } from "../../icons/manager";
  import { text } from "./helpers";

  let {
    name,
    selected = false,
    active = false,
    pressed = false,
    current = false,
    weight,
    className = "",
    onIconLoad,
  }: {
    name?: unknown;
    selected?: unknown;
    active?: unknown;
    pressed?: unknown;
    current?: unknown;
    weight?: IconWeight | null;
    className?: string;
    onIconLoad?: () => void;
  } = $props();

  let loadedIcons = $state<Record<string, string>>({});
  let iconRequest = 0;
  const iconName = $derived(text(name));

  function iconState(): IconState {
    return { selected, active, pressed, current, weight };
  }

  function hasStateVariant(): boolean {
    return !!(selected || active || pressed || current || (weight && weight !== "regular"));
  }

  function icon(): string {
    if (!iconName) return "";
    const nextState = iconState();
    const variantIcon = getIcon(iconName, nextState) || loadedIcons[iconCacheKey(iconName, nextState)] || "";
    if (variantIcon) return variantIcon;
    return hasStateVariant()
      ? getIcon(iconName) || loadedIcons[iconCacheKey(iconName)] || ""
      : "";
  }

  $effect(() => {
    const nextName = iconName;
    if (!nextName) return;
    const nextState = iconState();
    const key = iconCacheKey(nextName, nextState);
    if (getIcon(nextName, nextState) || loadedIcons[key]) return;

    const request = ++iconRequest;
    let active = true;
    void loadIcon(nextName, nextState).then((svg) => {
      if (!active || request !== iconRequest || !svg) return;
      loadedIcons = { ...loadedIcons, [key]: svg };
      onIconLoad?.();
    });
    return () => {
      active = false;
    };
  });
</script>

{#if icon()}
  <span class={`slex-icon ${className}`.trim()} aria-hidden="true">{@html icon()}</span>
{/if}
