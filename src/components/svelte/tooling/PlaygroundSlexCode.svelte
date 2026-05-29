<script lang="ts">
  import { mount, parseSlexSource } from "../../../engine/index";

  type Props = {
    lang?: string;
    text?: string;
    domain?: string;
  };

  let { lang = "", text = "", domain }: Props = $props();
  let error = $state<unknown>(null);

  const language = $derived(String(lang ?? "").trim().split(/\s+/, 1)[0].toLowerCase());
  const isSlexKit = $derived(language === "slex");
  const runtimeInput = $derived(scopedSlexKitInput(text, domain));

  function renderPreview(node: HTMLElement) {
    let cleanup: (() => void) | undefined;

    const render = () => {
      cleanup?.();
      node.replaceChildren();
      error = null;
      if (!isSlexKit) return;

      try {
        cleanup = mount(runtimeInput, node);
      } catch (err) {
        error = err;
      }
    };

    render();
    return {
      update: render,
      destroy() {
        cleanup?.();
        node.replaceChildren();
      },
    };
  }

  function scopedSlexKitInput(code: string, scope: string | undefined) {
    if (!scope) return code;
    const parsed = parseSlexSource(code);
    if (!parsed.ok || !parsed.value || typeof parsed.value !== "object") {
      return code;
    }
    const source = parsed.value as Record<string, unknown>;
    if (!("namespace" in source) && !("g" in source) && !("layout" in source) && Object.keys(source).some((key) => key.includes(":"))) {
      const { slex, ...layout } = source;
      return {
        ...(typeof slex === "string" ? { slex } : {}),
        namespace: `${scope}::default`,
        layout,
      };
    }
    return {
      ...source,
      namespace: `${scope}::${String(source.namespace || "default")}`,
    };
  }
</script>

{#if isSlexKit}
  {#if error}
    <div class="slex-streamdown-error" role="alert">
      <div class="slex-streamdown-error-title">Failed to render SlexKit</div>
      <div class="slex-streamdown-error-message">{error instanceof Error ? error.message : String(error)}</div>
    </div>
  {:else}
    <div use:renderPreview={runtimeInput}></div>
  {/if}
{:else}
  <pre class={lang}><code>{text}</code></pre>
{/if}
