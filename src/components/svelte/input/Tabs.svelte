<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { cancelScheduledFrame, emit, list, scheduleFrame, text, type ScheduledFrame } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let value = $state<unknown>(undefined);
  let iconVersion = $state(0);
  const orientation = $derived(text(p.orientation, "horizontal"));
  const items = $derived(list(p.tabs).map((item) => ({ ...item })));
  const triggerClass = "slex-tabs-trigger";
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    value = next.value;
  }));

  function choose(next: unknown): void {
    value = next;
    emit(ctx, "change", next);
  }

  function chooseIndex(index: number): void {
    const item = items[index];
    if (!item || item.disabled) return;
    choose(item.value ?? item.label);
  }

  function handleKeydown(event: KeyboardEvent, index: number): void {
    const enabledItems = items
      .map((item, itemIndex) => ({ item, itemIndex }))
      .filter(({ item }) => !item.disabled);
    const currentEnabledIndex = enabledItems.findIndex(({ itemIndex }) => itemIndex === index);
    if (currentEnabledIndex < 0) return;

    let nextEnabledIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextEnabledIndex = (currentEnabledIndex + 1) % enabledItems.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextEnabledIndex = (currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length;
    } else if (event.key === "Home") {
      nextEnabledIndex = 0;
    } else if (event.key === "End") {
      nextEnabledIndex = enabledItems.length - 1;
    }

    if (nextEnabledIndex === undefined) return;
    event.preventDefault();
    const nextIndex = enabledItems[nextEnabledIndex]?.itemIndex;
    if (nextIndex === undefined) return;
    chooseIndex(nextIndex);
    queueMicrotask(() => {
      const root = (event.currentTarget as HTMLElement | null)?.closest(".slex-tabs");
      const trigger = root?.querySelector<HTMLElement>(`.slex-tabs-trigger[data-value="${CSS.escape(text(items[nextIndex].value ?? items[nextIndex].label))}"]`);
      trigger?.focus();
    });
  }

  function requestIndicatorUpdate(): void {
    iconVersion += 1;
  }

  function isLayoutContent(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function renderTabPanel(node: HTMLElement, item: Record<string, unknown>) {
    function render(next: Record<string, unknown>) {
      node.replaceChildren();
      if (isLayoutContent(next.content)) {
        ctx.renderTree(next.content, node, ctx.forCtx);
        return;
      }
      if (next.content !== undefined && next.content !== null) {
        node.textContent = text(next.content);
      }
    }

    render(item);
    return {
      update(next: Record<string, unknown>) {
        render(next);
      },
      destroy() {
        node.replaceChildren();
      },
    };
  }

  function annotateTabs(node: HTMLElement) {
    let frame: ScheduledFrame | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let indicatorReady = false;
    let destroyed = false;

    function scheduleIndicatorUpdate(list: HTMLElement, selectedTrigger: HTMLElement | undefined, orientationSnapshot: string) {
      if (destroyed) return;
      cancelScheduledFrame(ctx, frame);
      frame = scheduleFrame(ctx, () => {
        frame = undefined;
        if (destroyed) return;
        if (!selectedTrigger) {
          list.style.setProperty("--slex-tabs-indicator-opacity", "0");
          return;
        }

        const listRect = list.getBoundingClientRect();
        const triggerRect = selectedTrigger.getBoundingClientRect();
        const iconRect = selectedTrigger
          .querySelector<HTMLElement>(".slex-tabs-trigger-icon")
          ?.getBoundingClientRect();
        const vertical = orientationSnapshot === "vertical";
        const indicatorStyle = getComputedStyle(list);
        const inlineInset = Number.parseFloat(indicatorStyle.getPropertyValue("--slex-tabs-indicator-inline-inset")) || 0;
        const blockInset = Number.parseFloat(indicatorStyle.getPropertyValue("--slex-tabs-indicator-block-inset")) || 0;
        const iconOnly = !!iconRect && selectedTrigger.classList.contains("slex-tabs-trigger--icon");
        const targetRect = iconOnly && iconRect.width > 0 ? iconRect : triggerRect;
        const width = vertical
          ? 2
          : iconOnly
            ? Math.max(14, Math.min(22, targetRect.width + 2))
            : Math.max(8, triggerRect.width - inlineInset * 2);
        const height = vertical ? Math.max(8, triggerRect.height - blockInset * 2) : 2;
        const targetCenterX = targetRect.left - listRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top - listRect.top + targetRect.height / 2;
        const x = vertical ? listRect.width - width : targetCenterX - width / 2;
        const y = vertical ? targetCenterY - height / 2 : listRect.height - height;
        list.style.setProperty("--slex-tabs-indicator-width", `${Math.max(0, width)}px`);
        list.style.setProperty("--slex-tabs-indicator-height", `${Math.max(0, height)}px`);
        list.style.setProperty("--slex-tabs-indicator-x", `${Math.max(0, x)}px`);
        list.style.setProperty("--slex-tabs-indicator-y", `${Math.max(0, y)}px`);
        list.style.setProperty("--slex-tabs-indicator-opacity", "1");
        if (!indicatorReady) {
          indicatorReady = true;
          scheduleFrame(ctx, () => {
            list.dataset.indicatorReady = "true";
          });
        }
      });
    }

    function applyNow() {
      if (destroyed) return;
      const triggers = node.querySelectorAll<HTMLElement>(".slex-tabs-trigger");
      const list = node.querySelector<HTMLElement>(".slex-tabs-list");
      let selectedTrigger: HTMLElement | undefined;
      items.forEach((item, index) => {
        const trigger = triggers[index];
        if (!trigger) return;
        const itemValue = item.value ?? item.label;
        const selected = text(itemValue) === text(value);
        trigger.dataset.value = text(itemValue);
        trigger.toggleAttribute("data-selected", selected);
        trigger.classList.toggle("slex-tabs-trigger--selected", selected);
        trigger.setAttribute("aria-selected", String(selected));
        if (selected) selectedTrigger = trigger;
      });
      if (list) scheduleIndicatorUpdate(list, selectedTrigger, orientation);
    }

    function apply() {
      if (destroyed) return;
      applyNow();
      queueMicrotask(() => {
        if (!destroyed) applyNow();
      });
    }

    apply();
    const list = node.querySelector<HTMLElement>(".slex-tabs-list");
    if (list && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(apply);
      resizeObserver.observe(list);
    }
    return {
      update() {
        apply();
      },
      destroy() {
        destroyed = true;
        cancelScheduledFrame(ctx, frame);
        resizeObserver?.disconnect();
      },
    };
  }
</script>

<div class="slex-tabs" data-orientation={orientation} use:annotateTabs={{ value, items, iconVersion }}>
  <div
    class="slex-tabs-list"
    role="tablist"
    aria-orientation={orientation}
  >
    {#each items as item, index}
      {@const itemValue = item.value ?? item.label}
      {@const selected = text(itemValue) === text(value)}
      {@const hasIcon = !!text(item.icon)}
      {@const label = text(item.label ?? itemValue)}
      {@const itemIconOnly = !!item.iconOnly || (hasIcon && !item.label)}
      {@const iconClass = itemIconOnly ? "slex-tabs-trigger--icon" : hasIcon ? "slex-tabs-trigger--with-icon" : ""}
      <button
        type="button"
        role="tab"
        id={`slex-tab-${ctx.id ?? "tabs"}-${index}`}
        aria-controls={`slex-tabpanel-${ctx.id ?? "tabs"}-${index}`}
        aria-selected={selected}
        tabindex={selected ? 0 : -1}
        disabled={!!item.disabled}
        data-value={text(itemValue)}
        data-disabled={item.disabled ? "" : undefined}
        data-selected={selected ? "" : undefined}
        class={`${triggerClass} ${selected ? "slex-tabs-trigger--selected" : ""} ${iconClass}`.trim()}
        onclick={() => chooseIndex(index)}
        onkeydown={(event) => handleKeydown(event, index)}
      >
        {#if hasIcon}
          <InlineIcon name={item.icon} selected={selected} className="slex-tabs-trigger-icon" onIconLoad={requestIndicatorUpdate} />
        {/if}
        {#if itemIconOnly}
          <span class="slex-sr-only">{label}</span>
        {:else}
          {label}
        {/if}
      </button>
    {/each}
    <span class="slex-tabs-selected-indicator" aria-hidden="true"></span>
  </div>
  {#each items as item, index}
    {@const itemValue = item.value ?? item.label}
    {@const selected = text(itemValue) === text(value)}
    {#if selected && item.content}
      <div
        id={`slex-tabpanel-${ctx.id ?? "tabs"}-${index}`}
        class="slex-tabs-content"
        role="tabpanel"
        aria-labelledby={`slex-tab-${ctx.id ?? "tabs"}-${index}`}
        use:renderTabPanel={item}
      ></div>
    {/if}
  {/each}
</div>
