<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, label as runtimeLabel, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import { resolveIconWeight } from "../../../icons/manager";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function variant(): string {
    const kind = text(p.type ?? p.variant ?? "primary");
    if (kind === "destructive") return "danger";
    if (kind === "default") return "primary";
    return kind;
  }

  function selected(): boolean {
    return resolveIconWeight({ selected: p.selected, active: p.active, pressed: p.pressed }) === "duotone";
  }

  function iconOnly(): boolean {
    return !!(p.iconOnly || (p.icon && !p.label));
  }

  function label(): string {
    return runtimeLabel(ctx, "button.label", p.label ?? p.title ?? p["aria-label"] ?? p.ariaLabel, componentName);
  }

  function click(event: MouseEvent): void {
    if (p.disabled) return;
    emit(ctx, "click", { type: "click", target: ctx.id, native: event });
  }
</script>

{#if p.href}
  <a
    class={`slex-button slex-button--${variant()} ${iconOnly() ? "slex-button--icon" : ""} ${p.disabled ? "slex-button--disabled" : ""}`}
    href={p.disabled ? undefined : text(p.href)}
    target={text(p.target) || undefined}
    rel={p.target === "_blank" ? "noreferrer" : undefined}
    aria-disabled={p.disabled ? "true" : undefined}
    data-selected={selected() ? "" : undefined}
    aria-pressed={p.pressed === undefined ? undefined : selected()}
    title={text(p.title ?? p.label)}
    aria-label={text(p["aria-label"] ?? p.ariaLabel ?? p.title ?? p.label) || undefined}
  >
    {#if p.icon}
      <InlineIcon name={p.icon} active={p.active} selected={p.selected} pressed={p.pressed} className="slex-button-icon" />
    {/if}
    {#if iconOnly()}
      <span class="slex-sr-only">{label()}</span>
    {:else}
      {label()}
    {/if}
  </a>
{:else}
  <button
    type="button"
    class={`slex-button slex-button--${variant()} ${iconOnly() ? "slex-button--icon" : ""}`}
    disabled={!!p.disabled}
    data-selected={selected() ? "" : undefined}
    aria-pressed={p.pressed === undefined ? undefined : selected()}
    title={text(p.title ?? p.label)}
    aria-label={text(p["aria-label"] ?? p.ariaLabel ?? p.title ?? p.label) || undefined}
    onclick={click}
  >
    {#if p.icon}
      <InlineIcon name={p.icon} active={p.active} selected={p.selected} pressed={p.pressed} className="slex-button-icon" />
    {/if}
    {#if iconOnly()}
      <span class="slex-sr-only">{label()}</span>
    {:else}
      {label()}
    {/if}
  </button>
{/if}
