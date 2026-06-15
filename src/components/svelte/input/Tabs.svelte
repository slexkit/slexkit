<script lang="ts">
  import FlowbiteTabs from "../../../../node_modules/flowbite-svelte/dist/tabs/Tabs.svelte";
  import FlowbiteTabItem from "../../../../node_modules/flowbite-svelte/dist/tabs/TabItem.svelte";
  import { bindPropStore } from "../bindProps";
  import { cancelScheduledFrame, emit, list, scheduleFrame, text, type ScheduledFrame } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let value = $state<unknown>(undefined);
  let iconVersion = $state(0);
  const orientation = $derived(text(p.orientation, "horizontal"));
  const items = $derived(list(p.tabs));
  const triggerClass = "slex-tabs-trigger";
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    value = next.value;
  }));

  function choose(next: unknown): void {
    value = next;
    emit(ctx, "change", next);
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

    function scheduleIndicatorUpdate(list: HTMLElement, selectedTrigger: HTMLElement | undefined) {
      cancelScheduledFrame(ctx, frame);
      frame = scheduleFrame(ctx, () => {
        frame = undefined;
        if (!selectedTrigger) {
          list.style.setProperty("--slex-tabs-indicator-opacity", "0");
          return;
        }

        const listRect = list.getBoundingClientRect();
        const triggerRect = selectedTrigger.getBoundingClientRect();
        const iconRect = selectedTrigger
          .querySelector<HTMLElement>(".slex-tabs-trigger-icon")
          ?.getBoundingClientRect();
        const vertical = orientation === "vertical";
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
      if (list) scheduleIndicatorUpdate(list, selectedTrigger);
    }

    function apply() {
      applyNow();
      queueMicrotask(applyNow);
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
        cancelScheduledFrame(ctx, frame);
        resizeObserver?.disconnect();
      },
    };
  }
</script>

<div class="slex-tabs" data-orientation={orientation} use:annotateTabs={{ value, items, iconVersion }}>
  <FlowbiteTabs
    class="slex-tabs-list"
    tabStyle="none"
    divider={false}
    selected={text(value)}
    aria-orientation={orientation}
    classes={{ content: "slex-tabs-content" }}
  >
    {#each items as item}
      {@const itemValue = item.value ?? item.label}
      {@const selected = text(itemValue) === text(value)}
      {@const hasIcon = !!text(item.icon)}
      {@const label = text(item.label ?? itemValue)}
      {@const itemIconOnly = !!item.iconOnly || (hasIcon && !item.label)}
      {@const iconClass = itemIconOnly ? "slex-tabs-trigger--icon" : hasIcon ? "slex-tabs-trigger--with-icon" : ""}
      <FlowbiteTabItem
        key={text(itemValue)}
        open={selected}
        disabled={!!item.disabled}
        data-value={text(itemValue)}
        activeClass={`${triggerClass} slex-tabs-trigger--selected ${iconClass}`}
        inactiveClass={`${triggerClass} ${iconClass}`}
        classes={{ button: selected ? "slex-tabs-trigger--selected" : "" }}
        onclick={() => choose(itemValue)}
      >
        {#snippet titleSlot()}
          {#if hasIcon}
            <InlineIcon name={item.icon} selected={selected} className="slex-tabs-trigger-icon" onIconLoad={requestIndicatorUpdate} />
          {/if}
          {#if itemIconOnly}
            <span class="slex-sr-only">{label}</span>
          {:else}
            {label}
          {/if}
        {/snippet}
        {#if item.content}<div use:renderTabPanel={item}></div>{/if}
      </FlowbiteTabItem>
    {/each}
    <span class="slex-tabs-selected-indicator" aria-hidden="true"></span>
  </FlowbiteTabs>
</div>
