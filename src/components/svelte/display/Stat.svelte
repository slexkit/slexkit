<script lang="ts">
  import { onMount } from "svelte";
  import { bindPropStore } from "../bindProps";
  import { text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";
  import { formatStatValue } from "./stat-format";

  let { props, componentName }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let previousDisplayValue = $state("");
  let currentDisplayValue = $state("");
  let valueChange = $state<"up" | "down" | "changed">("changed");
  let hasDisplayValue = false;
  let shouldAnimateValue = $state(false);
  let valueAnimationPhase = $state<"initial" | "update">("update");
  let valueElement: HTMLDivElement;
  let numberElement: HTMLSpanElement;
  let measurement = $state<{ width: number; measure: (value: string) => number }>();
  let lastRawValue = "";
  const rawValueText = $derived(p.value == null ? "" : String(p.value));
  const fullValueText = $derived([rawValueText, text(p.unit)].filter(Boolean).join(" "));
  const valueText = $derived(formatStatValue(p.value, measurement));
  const numericDisplay = $derived(typeof p.value === "number" || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(rawValueText));
  const valueSegments = $derived(numericDisplay ? statSegments(previousDisplayValue, currentDisplayValue) : []);

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
    const changedRawValue = rawValueText !== lastRawValue;
    lastRawValue = rawValueText;
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
    shouldAnimateValue = changedRawValue;
    valueAnimationPhase = "update";
  });

  onMount(() => {
    const document = valueElement.ownerDocument;
    const owner = document.defaultView!;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    let context: CanvasRenderingContext2D | null | undefined;
    let frame: number | undefined;
    let timer: number | undefined;
    let active = true;
    let force = false;
    let previousKey = "";
    const update = () => {
      if (!active || valueElement.clientWidth <= 0) return;
      const style = owner.getComputedStyle(numberElement);
      const unit = valueElement.querySelector<HTMLElement>(".slex-stat-unit");
      const gap = unit ? Number.parseFloat(owner.getComputedStyle(valueElement).columnGap) || 0 : 0;
      const unitWidth = unit ? Number.parseFloat(owner.getComputedStyle(unit).width) || unit.offsetWidth : 0;
      // Font metrics and clientWidth use CSS pixels, including under CSS zoom.
      const width = Math.max(0, valueElement.clientWidth - unitWidth - gap);
      const key = [width, style.fontFamily, style.fontSize, style.fontWeight, style.letterSpacing].join("|");
      if (!force && key === previousKey) return;
      force = false;
      previousKey = key;
      context ??= canvas.getContext("2d");
      if (!context) return;
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const fontSize = Number.parseFloat(style.fontSize);
      const spacing = Number.parseFloat(style.letterSpacing) || 0;
      const widths = new Map<string, number>();
      const measure = (value: string) => Array.from(value).reduce((sum, char) => {
        if (!widths.has(char)) widths.set(char, Math.max(context!.measureText(char).width, /^[0-9]$/.test(char) ? fontSize * 0.62 : 0) + spacing);
        return sum + widths.get(char)!;
      }, 0);
      // Include the animation's digit min-width, not just font glyph widths.
      for (const char of "0123456789.+-eE") measure(char);
      measurement = { width, measure };
    };
    const schedule = (fontChanged = false) => {
      if (!active) return;
      force ||= fontChanged;
      if (frame !== undefined || timer !== undefined) return;
      const flush = () => {
        if (frame !== undefined) owner.cancelAnimationFrame(frame);
        if (timer !== undefined) owner.clearTimeout(timer);
        frame = timer = undefined;
        update();
      };
      frame = owner.requestAnimationFrame(flush);
      // Hidden browser windows can suspend animation frames while layout is available.
      timer = owner.setTimeout(flush, 50);
    };
    const resize = new owner.ResizeObserver(() => schedule());
    resize.observe(valueElement);
    resize.observe(numberElement);
    const changes = new owner.MutationObserver((records) => schedule(records.some(record => record.type === "attributes")));
    changes.observe(valueElement, { childList: true, characterData: true, subtree: true });
    const root = valueElement.closest(".slexkit-root");
    const host = (valueElement.getRootNode() as ShadowRoot).host;
    for (const element of [root, host, document.documentElement, document.body]) {
      if (element) changes.observe(element, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    }
    const fontsChanged = () => schedule(true);
    document.fonts?.addEventListener("loadingdone", fontsChanged);
    void document.fonts?.ready.then(fontsChanged);
    schedule(true);
    return () => {
      active = false;
      if (frame !== undefined) owner.cancelAnimationFrame(frame);
      if (timer !== undefined) owner.clearTimeout(timer);
      resize.disconnect();
      changes.disconnect();
      document.fonts?.removeEventListener("loadingdone", fontsChanged);
    };
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
  <div class="slex-stat-value" bind:this={valueElement} title={fullValueText}>
    <span class="slex-stat-accessible-value">{fullValueText}</span>
    <span class="slex-stat-number" bind:this={numberElement} dir={numericDisplay ? "ltr" : "auto"} aria-hidden="true">
      {#if numericDisplay}
      {#each valueSegments as segment (segment.key)}
        <span
          class="slex-stat-character"
          data-stat-kind={segment.kind}
          data-stat-change={segment.changed && shouldAnimateValue ? valueChange : undefined}
          data-stat-initial={segment.changed && shouldAnimateValue && valueAnimationPhase === "initial" ? "true" : undefined}
          data-stat-previous={segment.previousChar || undefined}
        ><span class="slex-stat-character-current">{segment.char}</span></span>
      {/each}
      {:else}
        {currentDisplayValue}
      {/if}
    </span>
    {#if p.unit}<span class="slex-stat-unit" aria-hidden="true">{text(p.unit)}</span>{/if}
  </div>
</div>
