<script lang="ts">
  import { onMount } from "svelte";
  import { bindPropStore } from "../bindProps";
  import { emit, label, list, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let value = $state<unknown>("");
  let open = $state(false);
  let activeIndex = $state(-1);
  let triggerEl = $state<HTMLButtonElement | null>(null);
  const ariaLabel = $derived(text(p["aria-label"] ?? p.ariaLabel));
  const baseId = $derived(`slex-select-${ctx.id}`);
  const labelId = $derived(`${baseId}-label`);
  const valueId = $derived(`${baseId}-value`);
  const listboxId = $derived(`${baseId}-listbox`);
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    value = next.value ?? "";
    activeIndex = selectedIndex();
  }));

  const options = $derived(list(p.options).map((item) => ({
    label: text(item.label ?? item.value),
    value: text(item.value ?? item.label),
    disabled: !!item.disabled,
    icon: item.icon,
  })));

  const placeholder = $derived(label(ctx, "select.placeholder", p.placeholder, "Select..."));
  const selected = $derived(options.find((item) => item.value === text(value)));
  const displayLabel = $derived(selected?.label || placeholder);
  const activeOptionId = $derived(open && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined);

  onMount(() => {
    function closeFromOutside(event: MouseEvent): void {
      const target = event.target as Node | null;
      if (!target || !triggerEl?.closest(".slex-select")?.contains(target)) close(false);
    }

    document.addEventListener("mousedown", closeFromOutside);
    return () => document.removeEventListener("mousedown", closeFromOutside);
  });

  function choose(next: unknown): void {
    if (p.disabled) return;
    value = next;
    activeIndex = selectedIndex();
    close();
    emit(ctx, "change", next);
    emit(ctx, "select", next);
  }

  function selectedIndex(): number {
    return options.findIndex((item) => item.value === text(value));
  }

  function firstEnabledIndex(): number {
    return options.findIndex((item) => !item.disabled);
  }

  function lastEnabledIndex(): number {
    for (let i = options.length - 1; i >= 0; i -= 1) {
      if (!options[i].disabled) return i;
    }
    return -1;
  }

  function moveActive(delta: 1 | -1): void {
    if (!options.length) {
      activeIndex = -1;
      return;
    }
    const start = activeIndex >= 0 ? activeIndex : selectedIndex();
    let next = start;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + delta + options.length) % options.length;
      if (!options[next].disabled) {
        activeIndex = next;
        return;
      }
    }
    activeIndex = -1;
  }

  function openMenu(direction: 1 | -1 = 1): void {
    if (p.disabled) return;
    open = true;
    const current = selectedIndex();
    activeIndex = current >= 0 && !options[current]?.disabled
      ? current
      : direction > 0 ? firstEnabledIndex() : lastEnabledIndex();
  }

  function close(focusTrigger = true): void {
    open = false;
    activeIndex = selectedIndex();
    if (focusTrigger) requestAnimationFrame(() => triggerEl?.focus());
  }

  function toggle(): void {
    if (open) close(false);
    else openMenu();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (p.disabled) return;

    if (!open && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      openMenu(event.key === "ArrowUp" ? -1 : 1);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      activeIndex = firstEnabledIndex();
    } else if (event.key === "End") {
      event.preventDefault();
      activeIndex = lastEnabledIndex();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = options[activeIndex];
      if (item && !item.disabled) choose(item.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close(false);
    }
  }
</script>

<div class="slex-select" data-variant={text(p.variant, "default")}>
  {#if p.label || p.icon}
    <label class="slex-select-label" id={labelId} for={baseId}>
      {#if p.icon}<InlineIcon name={p.icon} className="slex-select-label-icon" />{/if}
      {#if p.label}<span>{text(p.label)}</span>{/if}
    </label>
  {/if}
  <button
    bind:this={triggerEl}
    id={baseId}
    type="button"
    class="slex-select-trigger"
    disabled={!!p.disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listboxId}
    aria-activedescendant={activeOptionId}
    aria-labelledby={p.label ? `${labelId} ${valueId}` : undefined}
    aria-label={!p.label && ariaLabel ? ariaLabel : undefined}
    onclick={toggle}
    onkeydown={onKeydown}
  >
    <span id={valueId} class="slex-select-value" data-placeholder={selected ? undefined : ""}>
      {#if selected?.icon}<InlineIcon name={selected.icon} selected className="slex-select-value-icon" />{/if}
      <span>{displayLabel}</span>
    </span>
    <span class="slex-select-icon" aria-hidden="true"></span>
  </button>
  {#if open}
    <ul
      id={listboxId}
      class="slex-select-menu"
      role="listbox"
      aria-labelledby={p.label ? labelId : undefined}
      aria-label={!p.label && ariaLabel ? ariaLabel : undefined}
    >
      {#each options as item, index}
        {@const isSelected = item.value === text(value)}
        {@const isActive = index === activeIndex}
        <li
          id={`${baseId}-option-${index}`}
          class="slex-select-option"
          class:slex-select-option--active={isActive}
          class:slex-select-option--selected={isSelected}
          role="option"
          aria-selected={isSelected}
          aria-disabled={item.disabled || undefined}
          data-disabled={item.disabled ? "" : undefined}
          onmouseenter={() => { if (!item.disabled) activeIndex = index; }}
          onmousedown={(event) => event.preventDefault()}
          onclick={() => { if (!item.disabled) choose(item.value); }}
        >
          <span class="slex-select-option-label">
            {#if item.icon}<InlineIcon name={item.icon} selected={isSelected} className="slex-select-option-icon" />{/if}
            <span>{item.label}</span>
          </span>
          {#if isSelected}<span class="slex-select-check" aria-hidden="true"></span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
  <select
    class="slex-select-native"
    bind:value
    disabled={!!p.disabled}
    required={!!p.required}
    tabindex="-1"
    aria-hidden="true"
    aria-label={ariaLabel || undefined}
    onchange={(event) => choose((event.target as HTMLSelectElement).value)}
  >
    <option value="" disabled={!!p.required}>{label(ctx, "select.placeholder", p.placeholder, "Select...")}</option>
    {#each options as item}
      <option value={item.value} disabled={item.disabled}>{item.label}</option>
    {/each}
  </select>
</div>
