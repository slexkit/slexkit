<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { label } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function submitTool(): void {
    if (p.disabled) return;
    const runtime = ctx.g.__slexkitTool as { submit?: (value: unknown) => void } | undefined;
    if (!runtime?.submit) return;
    const result: Record<string, unknown> = {};
    for (const key of Array.isArray(p.returnKeys) ? p.returnKeys : []) {
      result[String(key)] = String(key).split(".").reduce((current: unknown, part: string) => (
        current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined
      ), ctx.g);
    }
    runtime.submit(result);
  }

  function ignoreTool(): void {
    const runtime = ctx.g.__slexkitTool as { ignore?: () => void } | undefined;
    runtime?.ignore?.();
  }
</script>

<div class="slex-submit-bar">
  <button type="button" class="slex-button slex-button--ghost" onclick={ignoreTool}>{label(ctx, "submit.ignore", p.ignoreLabel, "Ignore")}</button>
  <button type="button" class="slex-button slex-button--primary" disabled={!!p.disabled} onclick={submitTool}>{label(ctx, "submit.submit", p.submitLabel, "Submit")}</button>
</div>
