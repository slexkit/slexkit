<script>
  import { onMount, tick } from "svelte";
  import { renderToolCall } from "../../../src/toolhost/index";
  import ToolReplayShell from "./ToolReplayShell.svelte";
  import {
    createToolHostReplay,
    replayUntilPause,
    submitToolResult,
    toolHostResponsesScenarios,
  } from "../../examples/toolhost-responses-replay.js";

  let { locale = "en-US" } = $props();

  let transcript = $state([]);
  let protocolItems = $state([]);
  let pendingToolCall = $state(null);
  let toolMount = $state(null);
  let replayState = createToolHostReplay([]);
  let activeHandle = null;

  const copyForLocale = (value) => toolHostResponsesScenarios[value] ?? toolHostResponsesScenarios["en-US"];
  const formatJson = (value) => JSON.stringify(value ?? {}, null, 2);
  let copy = $derived(copyForLocale(locale));
  let reference = $derived(referenceForLocale(locale));

  function referenceForLocale(value) {
    if (value === "zh-CN") {
      return {
        steps: [
          "Agent 产生 function_call：name 是 ToolHost 模板名，arguments 是模板参数。",
          "宿主把 function_call 映射成 ToolCall，并调用 renderToolCall()。",
          "用户在 Slex 卡片里提交，handle.promise 返回 ToolResult。",
          "宿主按原 call_id 回填 function_call_output，agent 继续运行。",
        ],
        code: `import { renderToolCall } from "slexkit";

async function runToolHostFunctionCall(item, container) {
  const toolCall = {
    id: item.call_id,
    name: item.name,
    arguments: JSON.parse(item.arguments ?? "{}"),
  };

  const handle = renderToolCall(toolCall, container);
  const result = await handle.promise;

  return {
    type: "function_call_output",
    call_id: toolCall.id,
    output: JSON.stringify(
      result.status === "submitted" ? result.value : { ignored: true },
    ),
  };
}`,
      };
    }

    return {
      steps: [
        "The agent emits a function_call; name is the ToolHost template and arguments are template input.",
        "The host maps the function_call into a ToolCall and calls renderToolCall().",
        "The user submits the Slex card; handle.promise resolves to a ToolResult.",
        "The host returns function_call_output with the original call_id, then the agent continues.",
      ],
      code: `import { renderToolCall } from "slexkit";

async function runToolHostFunctionCall(item, container) {
  const toolCall = {
    id: item.call_id,
    name: item.name,
    arguments: JSON.parse(item.arguments ?? "{}"),
  };

  const handle = renderToolCall(toolCall, container);
  const result = await handle.promise;

  return {
    type: "function_call_output",
    call_id: toolCall.id,
    output: JSON.stringify(
      result.status === "submitted" ? result.value : { ignored: true },
    ),
  };
}`,
    };
  }

  function outputFor(callId) {
    return transcript.find((item) => item.kind === "tool-output" && item.callId === callId)?.output ?? null;
  }

  function latestToolCall() {
    for (let index = transcript.length - 1; index >= 0; index -= 1) {
      const item = transcript[index];
      if (item.kind === "tool-call") return item;
    }
    return null;
  }

  function formatToolCall(call) {
    if (!call) return copy.notSetLabel;
    return call.name ?? copy.pendingCallLabel ?? "tool call";
  }

  function currentPhaseSummary() {
    if (replayState.status === "done") return copy.phaseDoneLabel;
    if (pendingToolCall) return copy.phaseToolInputLabel;
    return copy.phaseRunningLabel;
  }

  function functionCallSummary() {
    return formatToolCall(pendingToolCall ?? latestToolCall());
  }

  function toolHostCardSummary() {
    if (pendingToolCall) return pendingToolCall.name ?? copy.awaitingDecisionLabel;
    if (replayState.status === "done") return copy.completedLabel;
    return copy.notSetLabel;
  }

  function returnedOutputsSummary() {
    const count = protocolItems.filter((item) => item.type === "function_call_output").length;
    const expected = Number(copy.expectedToolOutputs ?? 2);
    return `${count}/${expected} function_call_output`;
  }

  function resultSummary(item) {
    if (item.callId === "call_release_parameters") {
      const selected = item.output?.strategy;
      return [
        copy.directions?.[selected],
        item.output?.window,
        item.output?.owner,
        item.output?.rollback,
      ].filter(Boolean).join(" / ");
    }
    if (item.callId === "call_approval") {
      return item.output?.confirmed ? copy.approvedLabel : copy.ignoredLabel;
    }
    return formatJson(item.output);
  }

  function resultTitle(item) {
    if (item.callId === "call_release_parameters") return copy.releaseParametersLabel;
    if (item.callId === "call_approval") return copy.approvalLabel;
    return copy.toolResultLabel;
  }

  let statusItems = $derived([
    { label: copy.currentPhaseLabel, value: currentPhaseSummary() },
    { label: copy.functionCallReceivedLabel, value: functionCallSummary() },
    { label: copy.toolHostCardLabel, value: toolHostCardSummary() },
    { label: copy.outputReturnedLabel, value: returnedOutputsSummary() },
  ]);

  function mountToolNode(node) {
    toolMount = node;
    void tick().then(mountPendingTool);
    return {
      destroy() {
        if (toolMount === node) toolMount = null;
      },
    };
  }

  let replayTranscript = $derived(transcript.map((item) => {
    if (item.kind === "tool-call" && item.status === "pending") {
      return { ...item, mountTool: mountToolNode };
    }
    if (item.kind === "tool-output") {
      return { ...item, title: resultTitle(item), summary: resultSummary(item) };
    }
    return item;
  }));

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

  async function mountPendingTool() {
    if (!pendingToolCall || !toolMount || activeHandle) return;
    const handle = renderToolCall(pendingToolCall, toolMount);
    activeHandle = handle;

    handle.promise.then(async (result) => {
      if (activeHandle !== handle) return;
      handle.dispose();
      activeHandle = null;
      submitToolResult(replayState, result);
      syncState();
      await tick();
      await mountPendingTool();
    });
  }

  async function restart() {
    disposeTool();
    const scenario = copyForLocale(locale);
    replayState = createToolHostReplay(scenario.events);
    replayUntilPause(replayState);
    syncState();
    await tick();
    await mountPendingTool();
  }

  onMount(() => {
    void restart();
    return disposeTool;
  });
</script>

<ToolReplayShell
  {copy}
  {reference}
  statusItems={statusItems}
  transcript={replayTranscript}
  {protocolItems}
  onRestart={restart}
/>
