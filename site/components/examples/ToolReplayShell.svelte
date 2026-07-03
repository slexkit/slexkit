<script>
  import { tick } from "svelte";

  let { copy, reference = { steps: [], code: "" }, statusItems = [], transcript = [], protocolItems = [], onRestart } = $props();
  let transcriptEl = $state(null);

  function attachPendingTool(node, item) {
    const cleanup = item.mountTool?.(node);
    if (typeof cleanup === "function") return { destroy: cleanup };
    if (cleanup && typeof cleanup.destroy === "function") return cleanup;
    return {};
  }

  function formatPayload(value) {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && typeof value.output === "string") {
      try {
        return JSON.stringify({ ...value, output: JSON.parse(value.output) }, null, 2);
      } catch {
        return JSON.stringify(value, null, 2);
      }
    }
    return JSON.stringify(value ?? {}, null, 2);
  }

  function previewText(value, max = 96) {
    const text = typeof value === "string" ? value : JSON.stringify(value ?? {});
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  function protocolSummary(item) {
    const summaries = copy.protocolSummaries ?? {};
    if (item.type === "message/output_text") {
      return `${summaries.messageOutput ?? item.label}: ${previewText(item.body, 88)}`;
    }
    if (item.type === "response.output_item.added") {
      return `${summaries.functionCallAdded ?? "function_call received"}: ${item.body?.name ?? item.label}`;
    }
    if (item.type === "response.function_call_arguments.delta") {
      return `${summaries.argumentsDelta ?? "arguments fragment"} (${String(item.body ?? "").length} chars)`;
    }
    if (item.type === "response.function_call_arguments.done") {
      return summaries.argumentsDone ?? "arguments assembled";
    }
    if (item.type === "response.output_item.done") {
      return `${summaries.outputItemDone ?? "function_call complete"}: ${item.body?.name ?? item.label}`;
    }
    if (item.type === "toolhost.slex_expression") {
      return summaries.slexExpression ?? "ToolHost compiled the call into Slex components";
    }
    if (item.type === "function_call_output") {
      return summaries.functionCallOutput ?? "ToolHost returned user input to the agent";
    }
    return previewText(item.body);
  }

  $effect(() => {
    transcript.length;
    void tick().then(() => {
      if (transcriptEl) transcriptEl.scrollTop = transcriptEl.scrollHeight;
    });
  });
</script>

<section class="slex-toolhost-replay slex-toolhost-replay--scenario" aria-label={copy.title}>
  <header class="slex-toolhost-replay-header">
    <div>
      <p class="slex-toolhost-replay-eyebrow">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <p>{copy.subtitle}</p>
    </div>
    <button class="slex-toolhost-replay-reset" type="button" onclick={onRestart}>{copy.restartLabel}</button>
  </header>

  <dl class="slex-toolhost-dialog-state" aria-label={copy.decisionLabel}>
    {#each statusItems as item (item.label)}
      <div>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
      </div>
    {/each}
  </dl>

  <section class="slex-toolhost-replay-panel" aria-label={copy.transcriptLabel}>
    <div class="slex-toolhost-replay-transcript" bind:this={transcriptEl}>
      {#each transcript as item (item.id)}
        {#if item.kind === "message"}
          <article class="slex-toolhost-message" data-role={item.role}>
            <span class="slex-toolhost-message-role">{item.role === "user" ? copy.userLabel : copy.assistantLabel}</span>
            <div class="slex-toolhost-message-bubble">
              <p>{item.text}</p>
            </div>
          </article>
        {:else if item.kind === "tool-call" && item.status === "pending"}
          <article class="slex-toolhost-message slex-toolhost-tool-turn slex-toolhost-active-turn" data-role="assistant">
            <span class="slex-toolhost-message-role">{copy.toolLabel}</span>
            <div class="slex-toolhost-call" data-status="pending">
              <div class="slex-toolhost-call-mount" use:attachPendingTool={item}></div>
            </div>
          </article>
        {:else if item.kind === "tool-output"}
          <article class="slex-toolhost-message slex-toolhost-result-turn" data-role="assistant">
            <span class="slex-toolhost-message-role">{copy.toolResultLabel || copy.toolLabel}</span>
            <div class="slex-toolhost-result" data-status={item.status}>
              <p>
                {#if item.title}
                  <strong>{item.title}</strong>
                  <em>=</em>
                {/if}
                {item.summary}
              </p>
            </div>
          </article>
        {/if}
      {/each}
    </div>
  </section>

  <details class="slex-toolhost-reference" aria-label={copy.referenceLabel ?? copy.protocolLabel}>
    <summary class="slex-toolhost-reference-summary">
      <span>{copy.referenceEyebrow ?? "SlexKit ToolHost"}</span>
      <strong>{copy.referenceTitle ?? copy.protocolLabel}</strong>
      {#if copy.referenceDescription}
        <small>{copy.referenceDescription}</small>
      {/if}
    </summary>
    <div class="slex-toolhost-reference-body">
      <ol class="slex-toolhost-reference-flow">
        {#each reference.steps as step, index}
          <li>
            <span>{index + 1}</span>
            <p>{step}</p>
          </li>
        {/each}
      </ol>
      <pre><code>{reference.code}</code></pre>
    </div>
  </details>

  {#if protocolItems.length}
    <details class="slex-toolhost-protocol" aria-label={copy.eventDetailsLabel ?? copy.protocolLabel}>
      <summary>{copy.eventDetailsLabel ?? copy.protocolLabel}</summary>
      <ol>
        {#each protocolItems as item (item.id)}
          <li data-generated={item.generated ? "true" : "false"}>
            <div class="slex-toolhost-protocol-head">
              <span>{item.type}</span>
              {#if item.generated}
                <small>{copy.generatedLabel}</small>
              {/if}
            </div>
            <p class="slex-toolhost-protocol-summary">{protocolSummary(item)}</p>
            <details class="slex-toolhost-protocol-payload">
              <summary>{copy.rawJsonLabel ?? "Raw JSON"}</summary>
              <pre>{formatPayload(item.raw ?? item.body)}</pre>
            </details>
          </li>
        {/each}
      </ol>
    </details>
  {/if}
</section>
