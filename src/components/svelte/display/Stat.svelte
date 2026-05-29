<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let previousDisplayValue = $state("");
  let currentDisplayValue = $state("");
  let valueChange = $state<"up" | "down" | "changed">("changed");
  let hasDisplayValue = false;
  let shouldAnimateValue = $state(false);
  let valueAnimationPhase = $state<"initial" | "update">("update");
  const valueText = $derived(text(p.value));
  const valueSegments = $derived(statSegments(previousDisplayValue, currentDisplayValue));

  $effect(() => bindPropStore(props, (next) => (p = next)));

  function numericValue(value: string): number | null {
    const parsed = Number.parseFloat(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function changeDirection(previous: string, next: string): "up" | "down" | "changed" {
    const previousNumber = numericValue(previous);
    const nextNumber = numericValue(next);
    if (previousNumber === null || nextNumber === null) return "changed";
    if (nextNumber > previousNumber) return "up";
    if (nextNumber < previousNumber) return "down";
    return "changed";
  }

  function booleanProp(value: unknown): boolean {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function initialPreviousValue(value: string): string {
    return Array.from(value).map((char) => isDigit(char) ? "0" : char).join("");
  }

  $effect(() => {
    const next = valueText;
    if (!hasDisplayValue) {
      shouldAnimateValue = booleanProp(p.animateInitial);
      previousDisplayValue = shouldAnimateValue ? initialPreviousValue(next) : next;
      currentDisplayValue = next;
      valueChange = "up";
      valueAnimationPhase = "initial";
      hasDisplayValue = true;
      return;
    }
    if (next === currentDisplayValue) return;
    valueChange = changeDirection(currentDisplayValue, next);
    previousDisplayValue = currentDisplayValue;
    currentDisplayValue = next;
    shouldAnimateValue = true;
    valueAnimationPhase = "update";
  });

  function isDigit(char: string): boolean {
    return /^[0-9]$/.test(char);
  }

  function statSegments(previous: string, current: string) {
    const previousChars = Array.from(previous);
    const currentChars = Array.from(current);
    const currentOffset = Math.max(0, currentChars.length - previousChars.length);
    const previousOffset = Math.max(0, previousChars.length - currentChars.length);
    return currentChars.map((char, index) => {
      const previousChar = previousChars[index - currentOffset + previousOffset] ?? "";
      return {
        char,
        previousChar,
        changed: previousChar !== char,
        key: `${index}:${char}`,
        kind: isDigit(char) ? "digit" : "symbol",
      };
    });
  }
</script>

<div class="slex-stat" data-tone={p.tone || p.type ? text(p.tone ?? p.type) : undefined}>
  <div class="slex-stat-label">
    {#if p.icon}<InlineIcon name={p.icon} className="slex-stat-icon" />{/if}
    <span>{text(p.label ?? componentName)}</span>
  </div>
  <div class="slex-stat-value">
    <span class="slex-stat-number">
      {#each valueSegments as segment (segment.key)}
        <span
          class="slex-stat-character"
          data-stat-kind={segment.kind}
          data-stat-change={segment.changed && shouldAnimateValue ? valueChange : undefined}
          data-stat-initial={segment.changed && shouldAnimateValue && valueAnimationPhase === "initial" ? "true" : undefined}
          data-stat-previous={segment.previousChar || undefined}
        ><span class="slex-stat-character-current">{segment.char}</span></span>
      {/each}
    </span>
    {#if p.unit}<span class="slex-stat-unit">{text(p.unit)}</span>{/if}
  </div>
</div>
