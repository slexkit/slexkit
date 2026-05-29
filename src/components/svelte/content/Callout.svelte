<script lang="ts">
  import FlowbiteToast from "../../../../node_modules/flowbite-svelte/dist/toast/Toast.svelte";
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function tone(): string {
    const raw = text(p.tone ?? p.type, "info").toLowerCase();
    if (raw === "error" || raw === "destructive") return "danger";
    if (raw === "neutral" || raw === "default" || raw === "muted") return "info";
    return raw;
  }

  function titleText(): string {
    return text(p.title ?? p.label ?? p.heading);
  }

  function descriptionText(): string {
    return text(p.text ?? p.content ?? p.description ?? p.message);
  }

  function role(): "alert" | "note" {
    return tone() === "danger" ? "alert" : "note";
  }

  function color(): "blue" | "green" | "yellow" | "red" | "gray" {
    const kind = tone();
    if (kind === "success") return "green";
    if (kind === "warning") return "yellow";
    if (kind === "danger") return "red";
    if (kind === "muted" || kind === "neutral") return "gray";
    return "blue";
  }
</script>

<FlowbiteToast
  class="slex-callout"
  data-scope="callout"
  data-tone={tone()}
  color={color()}
  role={role()}
  aria-live={role() === "alert" ? "assertive" : "polite"}
  dismissable={false}
  align={false}
  classes={{ icon: "slex-callout-mark", content: "slex-callout-content" }}
>
  {#snippet icon()}
    <span aria-hidden="true"></span>
  {/snippet}
  {#if titleText()}<div class="slex-callout-title">{#if p.icon}<InlineIcon name={p.icon} className="slex-callout-icon" />{/if}<span>{titleText()}</span></div>{/if}
  <div class="slex-callout-body" use:renderChildren={ctx}>{descriptionText()}</div>
</FlowbiteToast>
