<script lang="ts" module>
  let nextInputId = 0;
</script>

<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { bool, emit, text } from "../helpers";
  import { parseEngineeringNumber } from "../../../engine/engineering";
  import type { PropValues, SvelteComponentProps } from "../types";

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
  const componentId = $derived(safeId(componentName));
  const inputId = $derived(text(p.id) || (componentId ? `slex-input-${componentId}` : fallbackId));
  const descriptionId = $derived(`${inputId}-description`);
  const errorId = $derived(`${inputId}-error`);
  const explicitAriaLabel = $derived(text(p["aria-label"] ?? p.ariaLabel));
  const computedAriaLabel = $derived(explicitAriaLabel || (labelText ? "" : text(p.placeholder)));
  const describedBy = $derived([descriptionText ? descriptionId : "", errorText ? errorId : ""].filter(Boolean).join(" "));
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
  </div>
  {#if descriptionText}
    <div id={descriptionId} class="slex-input-description">{descriptionText}</div>
  {/if}
  {#if errorText}
    <div id={errorId} class="slex-input-error" role="alert">{errorText}</div>
  {/if}
</div>
