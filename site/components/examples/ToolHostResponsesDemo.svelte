<script>
  import { onMount, tick } from "svelte";
  import { registerToolTemplate, renderToolCall } from "../../../src/toolhost/index";
  import ToolReplayShell from "./ToolReplayShell.svelte";
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
  let replayState = createToolHostReplay([]);
  let activeHandle = null;

  registerToolTemplate("release-parameters", (args, runtime) => {
    const values = args.values && typeof args.values === "object" ? args.values : {};
    const options = Array.isArray(args.options)
      ? args.options.map((item, index) => ({
        ...item,
        value: item.value ?? item.id ?? String(index),
      }))
      : [];
    return {
      namespace: "tool_release_parameters",
      g: {
        __slexkitTool: runtime,
        options,
        selected: [],
        activeStep: "strategy",
        window: values.window ?? "",
        owner: values.owner ?? "",
        rollback: values.rollback ?? "",
        selectedLabel() {
          const selected = this.selected[0];
          const option = this.options.find((item) => item.value === selected || item.id === selected);
          return option?.label ?? "";
        },
        canSubmit() {
          return this.selected.length > 0 &&
            String(this.window).trim().length > 0 &&
            String(this.owner).trim().length > 0 &&
            String(this.rollback).trim().length > 0;
        },
      },
      layout: {
        "card:tool": {
          variant: "tool",
          title: args.title ?? "Release parameters",
          "text:description": {
            $if: args.description ? "true" : "false",
            text: args.description ?? "",
          },
          "step:strategy": {
            $if: "g.activeStep === 'strategy'",
            index: 1,
            total: 2,
            title: locale === "zh-CN" ? "发布策略" : "Release strategy",
            description: locale === "zh-CN" ? "先确认发布方式，再继续补齐工程约束。" : "Choose the release strategy, then continue to engineering constraints.",
            "radio-group:strategy": {
              $value: "g.selected[0] || ''",
              variant: "list",
              options,
              onchange: "g.selected = String($event || '') ? [String($event || '')] : []",
            },
            "row:strategyActions": {
              variant: "actions",
              justify: "end",
              "button:skip": {
                label: args.ignoreLabel ?? "Ignore",
                variant: "ghost",
                onclick: "g.__slexkitTool.ignore()",
              },
              "button:continue": {
                label: locale === "zh-CN" ? "继续" : "Continue",
                variant: "primary",
                $disabled: "!g.selected.length",
                onclick: "if (g.selected.length) g.activeStep = 'constraints'",
              },
            },
          },
          "step:constraints": {
            $if: "g.activeStep === 'constraints'",
            index: 2,
            total: 2,
            title: locale === "zh-CN" ? "工程约束" : "Engineering constraints",
            $description: locale === "zh-CN"
              ? "\"已选：\" + g.selectedLabel()"
              : "\"Selected: \" + g.selectedLabel()",
            "input:window": {
              label: locale === "zh-CN" ? "发布窗口" : "Release window",
              $value: "g.window",
              onchange: "g.window = String($event || '')",
            },
            "input:owner": {
              label: locale === "zh-CN" ? "负责人" : "Owner",
              $value: "g.owner",
              onchange: "g.owner = String($event || '')",
            },
            "input:rollback": {
              label: locale === "zh-CN" ? "回滚条件" : "Rollback criteria",
              $value: "g.rollback",
              onchange: "g.rollback = String($event || '')",
            },
            "button:back": {
              label: locale === "zh-CN" ? "返回发布策略" : "Back to strategy",
              variant: "ghost",
              onclick: "g.activeStep = 'strategy'",
            },
          },
          "submit:actions": {
            $if: "g.activeStep === 'constraints'",
            returnKeys: ["selected", "window", "owner", "rollback"],
            submitLabel: args.submitLabel ?? "Submit",
            ignoreLabel: args.ignoreLabel ?? "Ignore",
            $disabled: "!g.canSubmit()",
          },
        },
      },
    };
  });

  const copyForLocale = (value) => toolHostResponsesFixtures[value] ?? toolHostResponsesFixtures["en-US"];
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

  function selectedDirection() {
    const selected = outputFor("call_release_parameters")?.selected?.[0];
    return copy.directions?.[selected] ?? copy.notSetLabel;
  }

  function constraintsSummary() {
    const output = outputFor("call_release_parameters");
    if (!output) return copy.notSetLabel;
    return output.window ?? copy.notSetLabel;
  }

  function approvalSummary() {
    return outputFor("call_approval")?.confirmed ? copy.approvedLabel : copy.notSetLabel;
  }

  function resultSummary(item) {
    if (item.callId === "call_release_parameters") {
      const selected = item.output?.selected?.[0];
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
    { label: copy.directionLabel, value: selectedDirection() },
    { label: copy.constraintsLabel, value: constraintsSummary() },
    { label: copy.approvalLabel, value: approvalSummary() },
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
    const fixture = copyForLocale(locale);
    replayState = createToolHostReplay(fixture.events);
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
