<script>
  import { onMount, tick } from "svelte";
  import { renderToolCall } from "../../../src/toolhost/index";
  import {
    createToolHostReplay,
    replayUntilPause,
    submitToolResult,
    toolHostResponsesFixtures,
  } from "../../examples/toolhost-responses-replay.js";

  let { locale = "en-US" } = $props();

  let transcript = $state([]);
  let protocolItems = $state([]);
  let pendingToolCall = $state(null);
  let toolMount = $state(null);
  let transcriptEl = $state(null);
  let replayState = createToolHostReplay([]);
  let activeHandle = null;

  const copyForLocale = (value) => toolHostResponsesFixtures[value] ?? toolHostResponsesFixtures["en-US"];
  const formatJson = (value) => JSON.stringify(value ?? {}, null, 2);
  let copy = $derived(copyForLocale(locale));

  function outputFor(callId) {
    return transcript.find((item) => item.kind === "tool-output" && item.callId === callId)?.output ?? null;
  }

  function selectedDirection() {
    const selected = outputFor("call_direction")?.selected?.[0];
    return copy.directions?.[selected] ?? copy.notSetLabel;
  }

  function constraintsSummary() {
    const output = outputFor("call_constraints");
    if (!output) return copy.notSetLabel;
    return output.window ?? copy.notSetLabel;
  }

  function approvalSummary() {
    return outputFor("call_confirm")?.confirmed ? copy.approvedLabel : copy.notSetLabel;
  }

  function resultSummary(item) {
    if (item.callId === "call_direction") {
      const selected = item.output?.selected?.[0];
      return copy.directions?.[selected] ?? copy.notSetLabel;
    }
    if (item.callId === "call_constraints") {
      return [item.output?.window, item.output?.owner, item.output?.rollback].filter(Boolean).join(" / ");
    }
    if (item.callId === "call_confirm") {
      return item.output?.confirmed ? copy.approvedLabel : copy.ignoredLabel;
    }
    return formatJson(item.output);
  }

  function syncState() {
    transcript = [...replayState.transcript];
    protocolItems = [...replayState.protocolItems];
    pendingToolCall = replayState.pendingToolCall ? { ...replayState.pendingToolCall } : null;
  }

  function disposeTool() {
    if (activeHandle) {
      activeHandle.dispose();
      activeHandle = null;
    }
  }

  function scrollTranscript() {
    if (transcriptEl) transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  async function mountPendingTool() {
    if (!pendingToolCall || !toolMount || activeHandle) return;
    const handle = renderToolCall(pendingToolCall, toolMount);
    activeHandle = handle;
    scrollTranscript();

    handle.promise.then(async (result) => {
      if (activeHandle !== handle) return;
      handle.dispose();
      activeHandle = null;
      submitToolResult(replayState, result);
      syncState();
      await tick();
      scrollTranscript();
      await mountPendingTool();
    });
  }

  async function restart() {
    disposeTool();
    const fixture = copyForLocale(locale);
    replayState = createToolHostReplay(fixture.events);
    replayUntilPause(replayState);
    syncState();
    await tick();
    scrollTranscript();
    await mountPendingTool();
  }

  onMount(() => {
    void restart();
    return disposeTool;
  });
</script>

<section class="slex-toolhost-replay slex-toolhost-replay--scenario" aria-label={copy.title}>
  <header class="slex-toolhost-replay-header">
    <div>
      <p class="slex-toolhost-replay-eyebrow">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <p>{copy.subtitle}</p>
    </div>
    <button class="slex-toolhost-replay-reset" type="button" onclick={restart}>{copy.restartLabel}</button>
  </header>

  <dl class="slex-toolhost-dialog-state" aria-label={copy.decisionLabel}>
    <div>
      <dt>{copy.directionLabel}</dt>
      <dd>{selectedDirection()}</dd>
    </div>
    <div>
      <dt>{copy.constraintsLabel}</dt>
      <dd>{constraintsSummary()}</dd>
    </div>
    <div>
      <dt>{copy.approvalLabel}</dt>
      <dd>{approvalSummary()}</dd>
    </div>
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
        {:else if item.kind === "tool-call"}
          <article class="slex-toolhost-message slex-toolhost-tool-turn" data-role="assistant">
            <span class="slex-toolhost-message-role">{copy.toolLabel}</span>
            <div class="slex-toolhost-call" data-status={item.status}>
              <div class="slex-toolhost-call-head">
                <span>{item.status === "pending" ? copy.awaitingDecisionLabel : "function_call"}</span>
                <code>{item.name}</code>
                <small>
                  {#if item.status === "pending"}
                    {copy.pendingLabel}
                  {:else if item.status === "ignored"}
                    {copy.ignoredLabel}
                  {:else}
                    {copy.completedLabel}
                  {/if}
                </small>
              </div>
              {#if item.status === "pending"}
                <div class="slex-toolhost-call-mount" bind:this={toolMount}></div>
              {:else}
                <details class="slex-toolhost-json">
                  <summary>function_call arguments</summary>
                  <pre>{formatJson(item.arguments)}</pre>
                </details>
              {/if}
            </div>
          </article>
        {:else if item.kind === "tool-output"}
          <article class="slex-toolhost-message slex-toolhost-tool-turn" data-role="assistant">
            <span class="slex-toolhost-message-role">{copy.toolLabel}</span>
            <div class="slex-toolhost-output" data-status={item.status}>
              <div class="slex-toolhost-output-head">
                <span>function_call_output</span>
                <code>{item.callId}</code>
              </div>
              <p class="slex-toolhost-output-summary">{resultSummary(item)}</p>
              <details class="slex-toolhost-json">
                <summary>raw output</summary>
                <pre>{formatJson(item.output)}</pre>
              </details>
            </div>
          </article>
        {/if}
      {/each}
    </div>
  </section>

  <details class="slex-toolhost-protocol" aria-label={copy.protocolLabel}>
    <summary>{copy.protocolLabel}</summary>
    <ol>
      {#each protocolItems as item (item.id)}
        <li data-generated={item.generated ? "true" : "false"}>
          <div>
            <span>{item.type}</span>
            {#if item.generated}
              <small>{copy.generatedLabel}</small>
            {/if}
          </div>
          <code>{item.label}</code>
        </li>
      {/each}
    </ol>
  </details>
</section>
