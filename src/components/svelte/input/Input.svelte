<script lang="ts" module>
  let nextInputId = 0;
</script>

<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { bool, emit, text } from "../helpers";
  import { parseEngineeringNumber } from "../../../engine/engineering";
  import type { PropValues, SvelteComponentProps } from "../types";

  const engineeringPrefixFactors: Record<string, number> = {
    p: 1e-12,
    n: 1e-9,
    u: 1e-6,
    "\u00b5": 1e-6,
    "\u788c": 1e-6,
    m: 1e-3,
    k: 1e3,
    K: 1e3,
    M: 1e6,
    meg: 1e6,
    G: 1e9,
    T: 1e12,
  };

  let { componentName, props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let value = $state("");
  const fallbackId = `slex-input-${++nextInputId}`;
  const labelText = $derived(text(p.label));
  const unitText = $derived(text(p.unit));
  const descriptionText = $derived(text(p.description ?? p.help ?? p.hint));
  const errorText = $derived(text(p.error ?? p.errorMessage));
  const disabled = $derived(bool(p.disabled));
  const readonly = $derived(bool(p.readonly) || bool(p.readOnly));
  const required = $derived(bool(p.required));
  const invalid = $derived(bool(p.invalid) || !!errorText);
  const steppable = $derived(isSteppableInput());
  const controls = $derived(steppable && p.controls !== false && p.controls !== "false");
  const componentId = $derived(safeId(componentName));
  const inputId = $derived(text(p.id) || (componentId ? `slex-input-${componentId}` : fallbackId));
  const descriptionId = $derived(`${inputId}-description`);
  const errorId = $derived(`${inputId}-error`);
  const explicitAriaLabel = $derived(text(p["aria-label"] ?? p.ariaLabel));
  const computedAriaLabel = $derived(explicitAriaLabel || (labelText ? "" : text(p.placeholder)));
  const describedBy = $derived([descriptionText ? descriptionId : "", errorText ? errorId : ""].filter(Boolean).join(" "));
  const numericValue = $derived(readNumericValue());
  const controlLabel = $derived(labelText || text(p.placeholder) || componentName || "input");
  const decrementDisabled = $derived(!canStep(-1));
  const incrementDisabled = $derived(!canStep(1));
  $effect(() => bindPropStore(props, (next) => {
    p = next;
    value = text(next.value);
  }));

  function safeId(value: string): string {
    return value.trim().replace(/[^\w-]+/g, "-");
  }

  function inputType(): string {
    return text(p.type, "text") === "engineering" ? "text" : text(p.type, "text");
  }

  function isSteppableInput(): boolean {
    const kind = text(p.type, "text");
    return kind === "number" ||
      kind === "engineering" ||
      p.min !== undefined ||
      p.max !== undefined ||
      p.step !== undefined;
  }

  function numericProp(input: unknown): number | undefined {
    if (input === undefined || input === null || input === "") return undefined;
    const next = Number(input);
    return Number.isFinite(next) ? next : undefined;
  }

  function stepSize(): number {
    const next = numericProp(p.step);
    if (next !== undefined && next > 0) return next;
    if (text(p.type, "text") !== "engineering") return 1;
    const parsed = parseEngineeringNumber(value);
    if (!parsed.valid || !parsed.prefix) return 1;
    return engineeringPrefixFactors[parsed.prefix] ?? 1;
  }

  function readNumericValue(): number | null {
    if (text(p.type, "text") === "engineering") {
      const parsed = parseEngineeringNumber(value);
      return parsed.valid && parsed.number !== null ? parsed.number : null;
    }
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
  }

  function clamp(next: number): number {
    const min = numericProp(p.min);
    const max = numericProp(p.max);
    let clamped = next;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return clamped;
  }

  function canStep(direction: -1 | 1): boolean {
    if (!controls || disabled || readonly || numericValue === null) return false;
    return clamp(numericValue + direction * stepSize()) !== numericValue;
  }

  function formatSteppedValue(next: number): string {
    if (text(p.type, "text") !== "engineering") return text(next);
    const parsed = parseEngineeringNumber(value);
    if (!parsed.valid) return text(next);
    const factor = parsed.prefix ? engineeringPrefixFactors[parsed.prefix] : undefined;
    const visibleNumber = factor ? next / factor : next;
    return `${formatNumber(visibleNumber)}${parsed.prefix}${parsed.unit}`;
  }

  function formatNumber(next: number): string {
    return text(Number(next.toPrecision(12)));
  }

  function emitValue(nextValue: string): void {
    value = nextValue;
    emit(ctx, "change", text(p.type, "text") === "engineering" ? parseEngineeringNumber(value) : value);
  }

  function stepBy(direction: -1 | 1): void {
    if (!canStep(direction) || numericValue === null) return;
    emitValue(formatSteppedValue(clamp(numericValue + direction * stepSize())));
  }

  function update(event: Event): void {
    if (disabled || readonly) return;
    value = (event.target as HTMLInputElement).value;
    emit(ctx, "change", text(p.type, "text") === "engineering" ? parseEngineeringNumber(value) : value);
  }
</script>

<div
  class="slex-input-field"
  data-invalid={invalid ? "true" : undefined}
  data-required={required ? "true" : undefined}
  data-readonly={readonly ? "true" : undefined}
>
  {#if labelText}
    <label class="slex-input-label" for={inputId}>{labelText}</label>
  {/if}
  <div
    class="slex-input-control"
    data-has-unit={unitText ? "true" : undefined}
    data-has-controls={controls ? "true" : undefined}
  >
    <input
      id={inputId}
      class="slex-input"
      type={inputType()}
      inputmode={text(p.type, "text") === "engineering" ? "decimal" : undefined}
      bind:value
      name={text(p.name) || undefined}
      placeholder={text(p.placeholder)}
      disabled={disabled}
      readonly={readonly}
      required={required}
      min={p.min === undefined ? undefined : text(p.min)}
      max={p.max === undefined ? undefined : text(p.max)}
      step={p.step === undefined ? undefined : text(p.step)}
      aria-label={computedAriaLabel || undefined}
      aria-describedby={describedBy || undefined}
      aria-invalid={invalid ? "true" : undefined}
      oninput={update}
    />
    {#if unitText}
      <span class="slex-input-unit" aria-hidden="true">{unitText}</span>
    {/if}
    {#if controls}
      <span class="slex-input-controls">
        <button
          class="slex-input-step"
          type="button"
          aria-label={`Increase ${controlLabel}`}
          disabled={incrementDisabled}
          onclick={() => stepBy(1)}
        >+</button>
        <button
          class="slex-input-step"
          type="button"
          aria-label={`Decrease ${controlLabel}`}
          disabled={decrementDisabled}
          onclick={() => stepBy(-1)}
        >-</button>
      </span>
    {/if}
  </div>
  {#if descriptionText}
    <div id={descriptionId} class="slex-input-description">{descriptionText}</div>
  {/if}
  {#if errorText}
    <div id={errorId} class="slex-input-error" role="alert">{errorText}</div>
  {/if}
</div>
