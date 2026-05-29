<script lang="ts">
  import FlowbiteToast from "../../../../node_modules/flowbite-svelte/dist/toast/Toast.svelte";
  import { bindPropStore } from "../bindProps";
  import { bool, emit, label, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let visible = $state(true);
  $effect(() => bindPropStore(props, (next) => (p = next)));

  $effect(() => {
    const title = titleText();
    const description = descriptionText();
    const type = tone();
    if (!title && !description && !type) return;

    visible = true;
    const ms = durationMs();
    if (ms <= 0) return;

    const timer = setTimeout(() => {
      visible = false;
    }, ms);
    return () => clearTimeout(timer);
  });

  function tone(): string {
    const raw = text(p.type ?? p.tone ?? "info").toLowerCase();
    if (raw === "error" || raw === "destructive") return "danger";
    if (raw === "neutral" || raw === "default") return "info";
    return raw;
  }

  function titleText(): string {
    return text(p.title ?? p.label ?? p.heading);
  }

  function descriptionText(): string {
    return text(p.description ?? p.text ?? p.message ?? p.content);
  }

  function dismissable(): boolean {
    if (p.dismissable === undefined && p.dismissible === undefined) return true;
    return bool(p.dismissable ?? p.dismissible);
  }

  function durationMs(): number {
    const value = Number(p.duration ?? 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function close(): void {
    if (!visible) return;
    visible = false;
    emit(ctx, "close", { type: "close", target: ctx.id });
  }

  function handleGroupClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".slex-toast-close")) close();
  }

  function role(): "alert" | "status" {
    return tone() === "danger" ? "alert" : "status";
  }

  function color(): "blue" | "green" | "yellow" | "red" | "gray" {
    const kind = tone();
    if (kind === "success") return "green";
    if (kind === "warning") return "yellow";
    if (kind === "danger") return "red";
    if (kind === "muted" || kind === "neutral") return "gray";
    return "blue";
  }

  function closeLabel(): string {
    return label(ctx, "toast.close", p.closeLabel ?? p.closeAriaLabel, "Close");
  }
</script>

<div class="slex-toast-group" data-scope="toast" onclick={handleGroupClick}>
  {#if visible}
    <FlowbiteToast
      bind:toastStatus={visible}
      class="slex-toast"
      data-tone={tone()}
      color={color()}
      role={role()}
      aria-live={role() === "alert" ? "assertive" : "polite"}
      dismissable={dismissable()}
      closeAriaLabel={closeLabel()}
      classes={{ icon: "slex-toast-mark", content: "slex-toast-content", close: "slex-toast-close" }}
      onclose={close}
    >
      {#snippet icon()}
        <span aria-hidden="true"></span>
      {/snippet}
      {#if titleText()}<div class="slex-toast-title">{#if p.icon}<InlineIcon name={p.icon} className="slex-toast-icon" />{/if}<span>{titleText()}</span></div>{/if}
      {#if descriptionText()}<div class="slex-toast-description">{descriptionText()}</div>{/if}
    </FlowbiteToast>
  {/if}
</div>
