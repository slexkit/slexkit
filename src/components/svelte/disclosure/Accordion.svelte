<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { emit, list, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let value = $state<unknown>(undefined);
  let openStates = $state<Record<string, boolean>>({});
  const items = $derived(list(p.items));

  function keyFor(item: Record<string, unknown>) {
    return text(item.value ?? item.label);
  }

  function valueForKey(key: string) {
    const item = items.find((entry) => keyFor(entry) === key);
    return item ? (item.value ?? item.label) : undefined;
  }

  function selectedKeys(nextValue: unknown, multiple: boolean) {
    if (multiple && Array.isArray(nextValue)) return nextValue.map((entry) => text(entry));
    const selected = text(nextValue);
    return selected ? [selected] : [];
  }

  function openValue(states = openStates) {
    const keys = Object.keys(states).filter((key) => states[key]);
    if (p.multiple) return keys.map((key) => valueForKey(key)).filter((entry) => entry !== undefined);
    return keys.length ? valueForKey(keys[0]) : undefined;
  }

  $effect(() => bindPropStore(props, (next) => {
    p = next;
    value = next.value;
    const selected = selectedKeys(next.value, next.multiple === true);
    const nextOpenStates: Record<string, boolean> = {};
    for (const item of list(next.items)) {
      const key = keyFor(item);
      nextOpenStates[key] = selected.includes(key);
    }
    openStates = nextOpenStates;
  }));

  function toggleItem(key: string) {
    const open = !!openStates[key];
    let nextStates: Record<string, boolean>;
    if (p.multiple) {
      nextStates = { ...openStates, [key]: !open };
    } else {
      nextStates = {};
      for (const item of items) nextStates[keyFor(item)] = false;
      nextStates[key] = !open;
    }

    openStates = nextStates;
    const nextValue = openValue(nextStates);
    value = nextValue;
    emit(ctx, "change", nextValue);
  }
</script>

<div class="slex-accordion" data-scope="accordion">
  <div class="slex-accordion-inner">
    {#each items as item}
      {@const key = keyFor(item)}
      {@const open = !!openStates[key]}
      <section class="slex-accordion-item" data-state={open ? "open" : "closed"}>
        <h3 class="slex-accordion-heading">
          <button
            type="button"
            class="slex-accordion-trigger"
            data-state={open ? "open" : "closed"}
            aria-expanded={open}
            aria-controls={`${ctx.id}-${key}-content`}
            onclick={() => toggleItem(key)}
            disabled={item.disabled === true}
          >
            <span class="slex-accordion-label">
              {#if item.icon}<InlineIcon name={item.icon} selected={open} className="slex-accordion-icon" />{/if}
              <span>{text(item.label)}</span>
            </span>
            <span class="slex-accordion-indicator" aria-hidden="true"></span>
          </button>
        </h3>
        <div
          id={`${ctx.id}-${key}-content`}
          class="slex-accordion-content"
          data-state={open ? "open" : "closed"}
          aria-hidden={!open}
        >
          <div class="slex-accordion-content-inner">
            {text(item.content)}
          </div>
        </div>
      </section>
    {/each}
  </div>
</div>
