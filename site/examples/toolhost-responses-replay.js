function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function textEvent(role, text) {
  return {
    type: "message/output_text",
    role,
    text,
  };
}

function dynamicTextEvent(role, kind, locale) {
  return {
    type: "message/output_text.dynamic",
    role,
    kind,
    locale,
  };
}

function functionCallEvents({ itemId, callId, name, arguments: args }) {
  const json = JSON.stringify(args);
  const splitAt = Math.max(1, Math.floor(json.length * 0.58));
  return [
    {
      type: "response.output_item.added",
      item: {
        id: itemId,
        type: "function_call",
        call_id: callId,
        name,
        status: "in_progress",
      },
    },
    {
      type: "response.function_call_arguments.delta",
      item_id: itemId,
      delta: json.slice(0, splitAt),
    },
    {
      type: "response.function_call_arguments.delta",
      item_id: itemId,
      delta: json.slice(splitAt),
    },
    {
      type: "response.function_call_arguments.done",
      item_id: itemId,
      arguments: json,
    },
    {
      type: "response.output_item.done",
      item: {
        id: itemId,
        type: "function_call",
        call_id: callId,
        name,
        status: "completed",
        arguments: json,
      },
    },
  ];
}

function parseArguments(source) {
  if (!source) return {};
  try {
    const value = JSON.parse(source);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function outputFor(state, callId) {
  return state.transcript.find((item) => item.kind === "tool-output" && item.callId === callId)?.output ?? null;
}

const strategyLabels = {
  "zh-CN": {
    canary: "10% 灰度发布",
    full: "全量发布",
    hold: "暂缓发布",
  },
  "en-US": {
    canary: "10% canary release",
    full: "full release",
    hold: "hold release",
  },
};

function selectedStrategy(state, locale) {
  const selected = outputFor(state, "call_release_parameters")?.selected?.[0];
  return strategyLabels[locale]?.[selected] ?? strategyLabels[locale]?.canary ?? "";
}

function releaseConstraints(state, locale) {
  const fallback = locale === "zh-CN"
    ? {
        window: "今晚 22:00 - 23:00",
        owner: "值班 SRE / Web 平台负责人",
        rollback: "错误率超过 1% 或 P95 延迟连续 5 分钟高于 800ms",
      }
    : {
        window: "Tonight 22:00 - 23:00",
        owner: "on-call SRE / Web platform lead",
        rollback: "error rate exceeds 1% or P95 latency stays above 800ms",
      };
  return { ...fallback, ...(outputFor(state, "call_release_parameters") ?? {}) };
}

function renderDynamicText(state, event) {
  const locale = event.locale ?? "en-US";
  const strategy = selectedStrategy(state, locale);
  const constraints = releaseConstraints(state, locale);

  if (locale === "zh-CN") {
    if (event.kind === "plan_followup") {
      return `收到。计划会按${strategy}处理，窗口是${constraints.window}，由${constraints.owner}看护；回滚条件也会写进摘要。`;
    }
    if (event.kind === "final_summary") {
      return `发布计划已确认：${constraints.window} 采用${strategy}，由${constraints.owner}看护；若${constraints.rollback}，则立即回滚。`;
    }
  }

  if (event.kind === "plan_followup") {
    return `Received. I will shape the plan as a ${strategy} during ${constraints.window}, owned by ${constraints.owner}, with rollback criteria in the summary.`;
  }
  if (event.kind === "final_summary") {
    return `Release plan approved: use ${strategy} during ${constraints.window}, watched by ${constraints.owner}. Roll back immediately if ${constraints.rollback}.`;
  }

  return "";
}

const zhCNFixture = {
  title: "发布计划确认",
  subtitle: "AI 起草计划，在需要确认的位置暂停。",
  restartLabel: "重新播放",
  pendingLabel: "待确认",
  completedLabel: "已返回",
  ignoredLabel: "已忽略",
  transcriptLabel: "Agent 运行轨迹",
  protocolLabel: "接入参考",
  referenceLabel: "SlexKit ToolHost 接入参考",
  referenceEyebrow: "SlexKit ToolHost",
  referenceTitle: "Function call 的接入位置",
  referenceDescription: "ToolHost 是一个 human-input tool：agent 发起 function call，浏览器渲染 Slex 卡片，提交结果再以 function_call_output 回到 agent。",
  fixtureLabel: "Fixture 回放明细",
  generatedLabel: "生成",
  userLabel: "用户目标",
  assistantLabel: "Agent",
  toolLabel: "需要你确认",
  toolResultLabel: "返回给 Agent",
  toolCallLabel: "function call",
  toolOutputLabel: "function_call_output",
  argumentsLabel: "function_call arguments",
  rawOutputLabel: "Raw JSON",
  eyebrow: "Agent 运行轨迹",
  decisionLabel: "当前发布参数",
  awaitingDecisionLabel: "需要确认",
  directionLabel: "发布策略",
  constraintsLabel: "发布窗口",
  approvalLabel: "确认状态",
  releaseParametersLabel: "发布参数",
  releaseParametersSubmittedLabel: "发布参数已提交",
  approvalResultLabel: "确认结果",
  approvalSubmittedLabel: "发布计划已确认",
  notSetLabel: "未提交",
  approvedLabel: "已确认采用",
  directions: {
    canary: "10% 灰度发布",
    full: "全量发布",
    hold: "暂缓发布",
  },
  events: [
    textEvent("user", "帮我准备一次 Web 控制台发布计划。目标是低风险上线，必须可回滚，先不要真的执行。"),
    textEvent("assistant", "可以。我先需要你确认发布策略，并补齐发布窗口、负责人和回滚条件。"),
    ...functionCallEvents({
      itemId: "fc_release_parameters",
      callId: "call_release_parameters",
      name: "release-parameters",
      arguments: {
        title: "补齐发布参数",
        description: "一次性确认发布策略、窗口、负责人和回滚条件。",
        submitLabel: "提交发布参数",
        ignoreLabel: "跳过",
        options: [
          { id: "canary", label: "10% 灰度发布", description: "先开放少量流量，观察核心指标后再扩大范围" },
          { id: "full", label: "全量发布", description: "一次性切换全部流量，适合低风险补丁" },
          { id: "hold", label: "暂缓发布", description: "保留计划但不进入发布窗口" },
        ],
        values: {
          window: "今晚 22:00 - 23:00",
          owner: "值班 SRE / Web 平台负责人",
          rollback: "错误率超过 1% 或 P95 延迟连续 5 分钟高于 800ms",
        },
      },
    }),
    dynamicTextEvent("assistant", "plan_followup", "zh-CN"),
    ...functionCallEvents({
      itemId: "fc_approval",
      callId: "call_approval",
      name: "confirm-action",
      arguments: {
        title: "采用发布计划",
        description: "确认后只生成计划摘要，不会触发真实部署。",
        confirmLabel: "采用计划",
        ignoreLabel: "暂不采用",
      },
    }),
    dynamicTextEvent("assistant", "final_summary", "zh-CN"),
  ],
};

const enUSFixture = {
  title: "Release Plan Approval",
  subtitle: "AI drafts the plan and pauses where approval is needed.",
  restartLabel: "Replay",
  pendingLabel: "Pending",
  completedLabel: "Returned",
  ignoredLabel: "Ignored",
  transcriptLabel: "Agent trace",
  protocolLabel: "Integration reference",
  referenceLabel: "SlexKit ToolHost integration reference",
  referenceEyebrow: "SlexKit ToolHost",
  referenceTitle: "Where ToolHost sits in function calling",
  referenceDescription: "ToolHost is a human-input tool: the agent emits a function call, the browser renders a Slex card, and the submitted value returns as function_call_output.",
  fixtureLabel: "Fixture replay details",
  generatedLabel: "Generated",
  userLabel: "User goal",
  assistantLabel: "Agent",
  toolLabel: "Needs your confirmation",
  toolResultLabel: "Returned to agent",
  toolCallLabel: "function call",
  toolOutputLabel: "function_call_output",
  argumentsLabel: "function_call arguments",
  rawOutputLabel: "Raw JSON",
  eyebrow: "Agent trace",
  decisionLabel: "Current release parameters",
  awaitingDecisionLabel: "Needs approval",
  directionLabel: "Release strategy",
  constraintsLabel: "Release window",
  approvalLabel: "Approval state",
  releaseParametersLabel: "Release parameters",
  releaseParametersSubmittedLabel: "Release parameters submitted",
  approvalResultLabel: "Approval result",
  approvalSubmittedLabel: "Release plan approved",
  notSetLabel: "Not submitted",
  approvedLabel: "Plan approved",
  directions: {
    canary: "10% canary release",
    full: "Full release",
    hold: "Hold release",
  },
  events: [
    textEvent("user", "Prepare a release plan for the web console. Keep it low risk, make it rollbackable, and do not execute anything yet."),
    textEvent("assistant", "I need you to confirm the release strategy and complete the release window, owner, and rollback criteria first."),
    ...functionCallEvents({
      itemId: "fc_release_parameters",
      callId: "call_release_parameters",
      name: "release-parameters",
      arguments: {
        title: "Complete release parameters",
        description: "Confirm the release strategy, window, owner, and rollback criteria in one step.",
        submitLabel: "Submit release parameters",
        ignoreLabel: "Skip",
        options: [
          { id: "canary", label: "10% canary release", description: "Open a small amount of traffic first, then expand after checks pass" },
          { id: "full", label: "Full release", description: "Switch all traffic at once, suitable for low-risk patches" },
          { id: "hold", label: "Hold release", description: "Keep the plan but do not enter a release window" },
        ],
        values: {
          window: "Tonight 22:00 - 23:00",
          owner: "On-call SRE / Web platform lead",
          rollback: "Error rate above 1% or P95 latency above 800ms for 5 minutes",
        },
      },
    }),
    dynamicTextEvent("assistant", "plan_followup", "en-US"),
    ...functionCallEvents({
      itemId: "fc_approval",
      callId: "call_approval",
      name: "confirm-action",
      arguments: {
        title: "Adopt the release plan",
        description: "This only generates the approved plan summary. It does not deploy anything.",
        confirmLabel: "Approve plan",
        ignoreLabel: "Do not approve",
      },
    }),
    dynamicTextEvent("assistant", "final_summary", "en-US"),
  ],
};

export const toolHostResponsesFixtures = {
  "zh-CN": zhCNFixture,
  "en-US": enUSFixture,
};

export function createToolHostReplay(events) {
  return {
    events: clone(events),
    index: 0,
    transcript: [],
    protocolItems: [],
    pendingToolCall: null,
    drafts: new Map(),
    status: "idle",
  };
}

export function replayUntilPause(state) {
  state.status = "running";

  while (state.index < state.events.length) {
    const event = state.events[state.index];
    state.index += 1;

    if (event.type === "message/output_text" || event.type === "message/output_text.dynamic") {
      const text = event.type === "message/output_text.dynamic" ? renderDynamicText(state, event) : event.text;
      const id = `message_${state.transcript.length}`;
      state.transcript.push({
        id,
        kind: "message",
        role: event.role,
        text,
      });
      state.protocolItems.push({
        id,
        type: "message/output_text",
        label: event.role,
        body: text,
        raw: {
          type: "message",
          role: event.role,
          content: [{ type: "output_text", text }],
        },
      });
      continue;
    }

    if (event.type === "response.output_item.added" && event.item?.type === "function_call") {
      state.drafts.set(event.item.id, {
        id: event.item.id,
        callId: event.item.call_id,
        name: event.item.name,
        argsText: "",
      });
      state.protocolItems.push({
        id: `${event.item.id}_added`,
        type: event.type,
        label: event.item.name,
        body: { call_id: event.item.call_id, name: event.item.name },
        raw: {
          type: event.type,
          item: event.item,
        },
      });
      continue;
    }

    if (event.type === "response.function_call_arguments.delta") {
      const draft = state.drafts.get(event.item_id);
      if (draft) draft.argsText += event.delta ?? "";
      state.protocolItems.push({
        id: `${event.item_id}_delta_${state.protocolItems.length}`,
        type: event.type,
        label: event.item_id,
        body: event.delta ?? "",
        raw: {
          type: event.type,
          item_id: event.item_id,
          delta: event.delta ?? "",
        },
      });
      continue;
    }

    if (event.type === "response.function_call_arguments.done") {
      const draft = state.drafts.get(event.item_id);
      if (draft) draft.argsText = event.arguments ?? draft.argsText;
      state.protocolItems.push({
        id: `${event.item_id}_arguments_done`,
        type: event.type,
        label: event.item_id,
        body: parseArguments(event.arguments),
        raw: {
          type: event.type,
          item_id: event.item_id,
          arguments: event.arguments ?? "",
        },
      });
      continue;
    }

    if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
      const draft = state.drafts.get(event.item.id) ?? {
        id: event.item.id,
        callId: event.item.call_id,
        name: event.item.name,
        argsText: event.item.arguments ?? "",
      };
      const argsText = event.item.arguments ?? draft.argsText;
      const args = parseArguments(argsText);
      const call = {
        id: draft.callId,
        name: draft.name,
        arguments: args,
      };
      state.protocolItems.push({
        id: `${event.item.id}_done`,
        type: event.type,
        label: event.item.name,
        body: { call_id: draft.callId, name: draft.name, arguments: args },
        raw: {
          type: event.type,
          item: {
            ...event.item,
            arguments: argsText,
          },
        },
      });
      state.pendingToolCall = call;
      state.status = "paused";
      state.transcript.push({
        id: `tool_call_${call.id ?? event.item.id}_${state.transcript.length}`,
        kind: "tool-call",
        callId: call.id,
        name: call.name,
        arguments: call.arguments,
        status: "pending",
      });
      return state;
    }
  }

  state.status = "done";
  state.pendingToolCall = null;
  return state;
}

export function submitToolResult(state, result) {
  if (!state.pendingToolCall) {
    throw new Error("Cannot submit a ToolResult without a pending tool call.");
  }

  const call = state.pendingToolCall;
  const status = result.status === "ignored" ? "ignored" : "submitted";
  const output = status === "submitted" ? (result.value ?? {}) : { ignored: true };

  for (const item of state.transcript) {
    if (item.kind === "tool-call" && item.callId === call.id) {
      item.status = status;
    }
  }

  state.transcript.push({
    id: `tool_output_${call.id}_${state.transcript.length}`,
    kind: "tool-output",
    callId: call.id,
    toolName: call.name,
    status,
    output,
  });

  state.protocolItems.push({
    id: `function_call_output_${call.id}`,
    type: "function_call_output",
    label: call.id,
    body: {
      type: "function_call_output",
      call_id: call.id,
      output: JSON.stringify(output),
    },
    raw: {
      type: "function_call_output",
      call_id: call.id,
      output: JSON.stringify(output),
    },
    generated: true,
  });

  state.pendingToolCall = null;
  return replayUntilPause(state);
}
