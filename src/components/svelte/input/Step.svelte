<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { renderChildren, text } from "../helpers";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));

  function progress(): string {
    if (p.progress) return text(p.progress);
    const current = p.index ?? p.number;
    if (!current) return "";
    if (p.total) return `${text(current)}/${text(p.total)}`;
    return text(current);
  }
</script>

<section class="slex-step" data-state={p.state ? text(p.state) : undefined}>
  <header class="slex-step-header">
    <div class="slex-step-heading">
      {#if progress()}
        <span class="slex-step-progress">{progress()}</span>
      {/if}
      {#if p.title}
        <h3>{text(p.title)}</h3>
      {/if}
    </div>
    <div>
      {#if p.description}
        <p>{text(p.description)}</p>
      {/if}
    </div>
  </header>
  <div class="slex-step-body" use:renderChildren={ctx}></div>
</section>
